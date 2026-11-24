from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"status": "ok", "service": "stt"}


def test_invalid_audio_is_not_canned_success(monkeypatch):
    class InvalidDecoder:
        def transcribe(self, *args, **kwargs):
            raise ValueError("invalid audio")

    monkeypatch.setattr("app.main.load_model", lambda: InvalidDecoder())
    res = client.post("/transcribe", files={"audio": ("a.wav", b"x")})
    assert res.status_code == 422


def test_empty_audio():
    assert client.post("/transcribe", files={"audio": ("empty.wav", b"")}).status_code == 413


class FakeModel:
    def __init__(self, device, fail=False):
        self.device, self.fail = device, fail

    def transcribe(self, *args, **kwargs):
        if self.fail:
            raise RuntimeError("Library libcudnn_ops.so.9 is not found")
        return iter([]), None


def use_fakes(monkeypatch, cuda_count, cuda_fails=False):
    from app import main

    main.load_model.cache_clear()
    opened = []

    def fake_open(device, compute_type):
        opened.append((device, compute_type))
        return FakeModel(device, fail=cuda_fails and device == "cuda")

    monkeypatch.setattr(main, "_cuda_devices", lambda: cuda_count)
    monkeypatch.setattr(main, "_open", fake_open)
    return main, opened


def test_gpu_is_used_when_it_works(monkeypatch):
    main, opened = use_fakes(monkeypatch, cuda_count=1)
    assert main.load_model().device == "cuda"
    assert main.RUNTIME == {"device": "cuda", "compute_type": "float16"}
    main.load_model.cache_clear()


def test_falls_back_to_cpu_when_cuda_fails_at_inference(monkeypatch):
    main, opened = use_fakes(monkeypatch, cuda_count=1, cuda_fails=True)
    assert main.load_model().device == "cpu"
    assert opened == [("cuda", "float16"), ("cpu", "int8")]
    assert main.RUNTIME == {"device": "cpu", "compute_type": "int8"}
    main.load_model.cache_clear()


def test_no_gpu_means_cpu_int8_as_before(monkeypatch):
    main, opened = use_fakes(monkeypatch, cuda_count=0)
    main.load_model()
    assert opened == [("cpu", "int8")]
    main.load_model.cache_clear()


def test_cpu_can_be_forced(monkeypatch):
    main, opened = use_fakes(monkeypatch, cuda_count=1)
    monkeypatch.setattr(main, "DEVICE", "cpu")
    main.load_model()
    assert opened == [("cpu", "int8")]
    main.load_model.cache_clear()
