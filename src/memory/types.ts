/** Memory facts NOAH recalls to behave like it already knows your machine. */
export type FactKind = "machine" | "preference" | "learning";

export interface Fact {
  id: string;
  kind: FactKind;
  text: string;
  source: string; // "telemetry" | "user" | extension name, etc.
  at: number; // epoch ms
}

export type FactInput = Pick<Fact, "kind" | "text" | "source">;
