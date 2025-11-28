export interface UniversalMessage {
  text: string;
  user: { id: string };
  platform: "web" | "slack";
}

export interface UniversalResponse {
  text: string;
  platform: string;
}
