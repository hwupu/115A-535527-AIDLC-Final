import data from "./questions.json";

// Fixed intake questions for the patient screen (#86). Fixed text and order, written by people, never by the AI.
// A question with a followUp is a yes/no question: the follow-up is shown only when the patient taps 「有」.
// `fields` maps the question to report fields; the nurse checklist (#87) can reuse it.
// `speak` is the text read aloud when it differs from the screen text (no brackets, numbers in words).
// Audio files: public/audio/questions/<id>.mp3, made by scripts/make-question-audio.sh from this list.

export interface FollowUp {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  speak?: string;
  fields: string[];
  followUp?: FollowUp;
}

export type Step = { question: Question; followUp?: FollowUp };

export const questionSetVersion: string = data.version;
export const questions: Question[] = data.questions;

export const stepId = (s: Step) => s.followUp?.id ?? s.question.id;
export const stepText = (s: Step) => s.followUp?.text ?? s.question.text;
export const audioUrl = (id: string) => `${import.meta.env.BASE_URL}audio/questions/${id}.mp3`;

// What goes into the transcript with each answer, so a short answer like 「沒有」 still maps to the right field.
export const transcriptLine = (question: string, answer?: string) => (answer === undefined ? `問：${question}` : `問：${question} 答：${answer}`);
