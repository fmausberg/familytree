import type { Gender } from "@prisma/client";

export const genderLabels: Record<Gender, string> = {
  FEMALE: "Weiblich",
  MALE: "Männlich",
  DIVERSE: "Divers",
  UNKNOWN: "Unbekannt",
};

export type PersonValues = {
  givenNames: string;
  surname: string;
  birthName: string;
  gender: string;
};

export type PersonFormState = {
  error?: string;
  errors?: Partial<Record<keyof PersonValues, string>>;
  values?: PersonValues;
};

export function personName(person: { givenNames: string | null; surname: string | null }) {
  return [person.givenNames, person.surname].filter(Boolean).join(" ") || "Person ohne Namen";
}
