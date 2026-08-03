export interface EmailInput {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  preview: string;
  receivedAt: string;
}

export interface EmailScore {
  id: string;
  importanceScore: number;
  section: "now" | "today" | "this-week" | "waiting" | "read-later" | "archive";
  explanation: string;
  actionRequired: boolean;
  waitingStatus: "needs-my-reply" | "waiting-on-them" | "no-action";
  deadlineDetected: boolean;
  deadlineText: string | null;
}
