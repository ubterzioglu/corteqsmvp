import { useReducer, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { notifySubmission } from "@/lib/mail";
import {
  getCategoryLabel,
  getReferralSourceLabel,
  toSubmissionInsert,
  uploadSubmissionDocuments,
  validateReferralCodeBeforeSubmit,
  validateSubmissionDocuments,
} from "@/lib/submissions";
import {
  type ChatStep,
  type ChatMessage,
  type ChatCollectedData,
  INITIAL_DATA,
  STEP_ORDER,
  getStepMessage,
  validateStep,
  detectCommand,
  getNextStep,
  generateId,
  resolveCategoryInput,
} from "@/lib/chatConfig";

export type ChatState = {
  step: ChatStep;
  messages: ChatMessage[];
  data: ChatCollectedData;
  documentFiles: File[];
  loading: boolean;
  error: string | null;
  submitted: boolean;
  stepHistory: ChatStep[];
  prefillCity: string | null;
};

type ChatAction =
  | { type: "SEND_MESSAGE"; payload: string }
  | { type: "SELECT_QUICK_REPLY"; payload: string }
  | { type: "SELECT_CATEGORY"; payload: string }
  | { type: "SELECT_SOURCE"; payload: string }
  | { type: "UPLOAD_FILES"; payload: File[] }
  | { type: "REMOVE_FILE"; payload: number }
  | { type: "CONFIRM_SUBMIT" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_ERROR"; payload: string }
  | { type: "GO_BACK" }
  | { type: "RESET" }
  | { type: "PREFILL_CITY"; payload: string }
  | { type: "START_OVER_FROM_SUMMARY" }
  | { type: "BEGIN_REGISTRATION"; payload?: string }
  | {
      type: "APPEND_MESSAGE";
      payload: Pick<ChatMessage, "role" | "content" | "quickReplies" | "isSummary">;
    };

function addBotMessage(messages: ChatMessage[], step: ChatStep, data: ChatCollectedData): ChatMessage[] {
  const { content, quickReplies, isSummary } = getStepMessage(step, data);
  const msg: ChatMessage = {
    id: generateId(),
    role: "bot",
    content,
    timestamp: Date.now(),
    quickReplies,
    isSummary,
  };
  return [...messages, msg];
}

function addUserMessage(messages: ChatMessage[], content: string): ChatMessage[] {
  return [
    ...messages,
    {
      id: generateId(),
      role: "user" as const,
      content,
      timestamp: Date.now(),
    },
  ];
}

function advanceStep(state: ChatState, currentStep: ChatStep): Partial<ChatState> {
  const nextStep = getNextStep(currentStep, state.data);
  const updatedMessages = addBotMessage(state.messages, nextStep, state.data);
  return {
    step: nextStep,
    messages: updatedMessages,
    stepHistory: [...state.stepHistory, nextStep],
  };
}

function INITIAL_STATE(): ChatState {
  const messages: ChatMessage[] = [];
  const step: ChatStep = "welcome";
  const data = { ...INITIAL_DATA };

  const welcomeMsg = getStepMessage("welcome", data);
  messages.push({
    id: generateId(),
    role: "bot",
    content: welcomeMsg.content,
    timestamp: Date.now(),
    quickReplies: welcomeMsg.quickReplies,
  });

  return {
    step,
    messages,
    data,
    documentFiles: [],
    loading: false,
    error: null,
    submitted: false,
    stepHistory: ["welcome"],
    prefillCity: null,
  };
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "RESET":
      return INITIAL_STATE();

    case "PREFILL_CITY": {
      if (state.prefillCity) return state;
      return { ...state, prefillCity: action.payload, data: { ...state.data, city: action.payload } };
    }

    case "BEGIN_REGISTRATION": {
      if (state.step !== "welcome") return state;
      const messages = action.payload ? addUserMessage(state.messages, action.payload) : state.messages;
      const nextState = { ...state, messages };
      const advanced = advanceStep(nextState, "welcome");
      return { ...nextState, ...advanced };
    }

    case "APPEND_MESSAGE":
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: generateId(),
            role: action.payload.role,
            content: action.payload.content,
            timestamp: Date.now(),
            quickReplies: action.payload.quickReplies,
            isSummary: action.payload.isSummary,
          },
        ],
      };

    case "SELECT_QUICK_REPLY": {
      const value = action.payload;

      if (value === "__start__") {
        return chatReducer(state, { type: "BEGIN_REGISTRATION" });
      }

      if (value === "__skip__") {
        const advanced = advanceStep(state, state.step);
        return { ...state, ...advanced };
      }

      if (value === "__confirm__") {
        return { ...state, loading: true, error: null };
      }

      if (value === "__go_back__") {
        return chatReducer(state, { type: "START_OVER_FROM_SUMMARY" });
      }

      if (value === "__add_more__") {
        return state;
      }

      if (value === "__continue__") {
        const advanced = advanceStep(state, "documents_add_more");
        return { ...state, ...advanced };
      }

      if (state.step === "category") {
        const newData = { ...state.data, category: value };
        const label = getCategoryLabel(value);
        let msgs = addUserMessage(state.messages, label);
        const st: ChatState = { ...state, messages: msgs, data: newData, stepHistory: [...state.stepHistory] };

        if (value === "blogger-vlogger") {
          const contestStep: ChatStep = "contest_interest";
          msgs = addBotMessage(msgs, contestStep, newData);
          return { ...st, step: contestStep, messages: msgs, stepHistory: [...st.stepHistory, contestStep] };
        }

        const advanced = advanceStep(st, "category");
        return { ...st, ...advanced };
      }

      if (state.step === "contest_interest") {
        const newData = { ...state.data, contest_interest: value === "yes" };
        const msgs = addUserMessage(state.messages, value === "yes" ? "Evet" : "Hay\u0131r");
        const st: ChatState = { ...state, messages: msgs, data: newData, stepHistory: [...state.stepHistory] };
        const advanced = advanceStep(st, "contest_interest");
        return { ...st, ...advanced };
      }

      if (state.step === "referral_source") {
        const newData = { ...state.data, referral_source: value, referral_detail: null };
        const msgs = addUserMessage(state.messages, getReferralSourceLabel(value));
        const st: ChatState = { ...state, messages: msgs, data: newData, stepHistory: [...state.stepHistory] };
        const advanced = advanceStep(st, "referral_source");
        return { ...st, ...advanced };
      }

      if (state.step === "consent") {
        const newData = { ...state.data, consent: value === "yes" };
        const msgs = addUserMessage(state.messages, "Onayl\u0131yorum \u2705");
        const st: ChatState = { ...state, messages: msgs, data: newData, stepHistory: [...state.stepHistory] };
        const advanced = advanceStep(st, "consent");
        return { ...st, ...advanced };
      }

      const msgs = addUserMessage(state.messages, value);
      return { ...state, messages: msgs };
    }

    case "SEND_MESSAGE": {
      const input = action.payload;
      const command = detectCommand(input);

      if (command === "reset") {
        return INITIAL_STATE();
      }

      if (command === "back" || command === "classic_form") {
        return state;
      }

      if (command === "skip") {
        const stepIdx = STEP_ORDER.indexOf(state.step);
        const isOptional = stepIdx >= 0 && ![
          "category", "fullname", "country", "city", "field", "email", "phone", "consent",
        ].includes(state.step as string);

        if (isOptional) {
          const msgs = addUserMessage(state.messages, "Ge\u00e7");
          const st: ChatState = { ...state, messages: msgs };
          const advanced = advanceStep(st, state.step);
          return { ...st, ...advanced };
        }
        return state;
      }

      const validation = validateStep(state.step, input, state.data);
      if (!validation.ok) {
        const errorMsg: ChatMessage = {
          id: generateId(),
          role: "bot",
          content: validation.message,
          timestamp: Date.now(),
        };
        return { ...state, messages: [...addUserMessage(state.messages, input), errorMsg] };
      }

      const msgs = addUserMessage(state.messages, input);
      const newData = { ...state.data };

      switch (state.step) {
        case "fullname":
          newData.fullname = input.trim();
          break;
        case "country":
          newData.country = input.trim();
          break;
        case "city":
          newData.city = input.trim();
          break;
        case "business":
          newData.business = input.trim();
          break;
        case "field":
          newData.field = input.trim();
          break;
        case "email":
          newData.email = input.trim();
          break;
        case "phone":
          newData.phone = input.trim().replace(/[\s\-().]/g, "");
          break;
        case "referral_detail":
          newData.referral_detail = input.trim();
          break;
        case "referral_code":
          newData.referral_code = input.trim().toUpperCase();
          break;
        case "offers_needs":
          newData.offers_needs = input.trim();
          break;
        default:
          break;
      }

      const st: ChatState = { ...state, messages: msgs, data: newData, stepHistory: [...state.stepHistory] };
      const advanced = advanceStep(st, state.step);
      return { ...st, ...advanced };
    }

    case "UPLOAD_FILES": {
      const files = action.payload;
      const result = validateSubmissionDocuments(files, state.documentFiles);
      if (!result.ok) {
        const errorMsg: ChatMessage = {
          id: generateId(),
          role: "bot",
          content: result.message,
          timestamp: Date.now(),
        };
        return { ...state, messages: [...state.messages, errorMsg] };
      }

      const fileNames = files.map((f) => f.name).join(", ");
      const msgs = addUserMessage(state.messages, `Dosya y\u00fcklendi: ${fileNames}`);

      const nextStep: ChatStep = result.files.length >= 5 ? "consent" : "documents_add_more";

      const st: ChatState = {
        ...state,
        messages: msgs,
        documentFiles: result.files,
        stepHistory: [...state.stepHistory],
      };

      if (nextStep === "documents_add_more") {
        const botMsgs = addBotMessage(msgs, "documents_add_more", st.data);
        return {
          ...st,
          step: "documents_add_more",
          messages: botMsgs,
          stepHistory: [...st.stepHistory, "documents_add_more"],
        };
      }

      const advanced = advanceStep(st, "documents");
      return { ...st, ...advanced };
    }

    case "REMOVE_FILE": {
      const idx = action.payload;
      const updated = state.documentFiles.filter((_, i) => i !== idx);
      return { ...state, documentFiles: updated };
    }

    case "GO_BACK": {
      if (state.stepHistory.length < 2) return state;
      const prevStep = state.stepHistory[state.stepHistory.length - 2];
      const trimmedHistory = state.stepHistory.slice(0, -1);
      const msgs = addBotMessage(state.messages, prevStep, state.data);
      return { ...state, step: prevStep, messages: msgs, stepHistory: trimmedHistory };
    }

    case "START_OVER_FROM_SUMMARY": {
      if (state.stepHistory.length < 2) return state;
      const prevStep = state.stepHistory[state.stepHistory.length - 2];
      const trimmedHistory = state.stepHistory.slice(0, -1);
      const msgs = addBotMessage(state.messages, prevStep, state.data);
      return { ...state, step: prevStep, messages: msgs, stepHistory: trimmedHistory };
    }

    case "CONFIRM_SUBMIT":
      return { ...state, loading: true, error: null };

    case "SUBMIT_SUCCESS":
      return { ...state, loading: false, submitted: true };

    case "SUBMIT_ERROR":
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
}

export function useChatMachine() {
  const [state, dispatch] = useReducer(chatReducer, undefined, INITIAL_STATE);
  const submitRef = useRef(false);

  const sendMessage = useCallback((input: string) => {
    if (state.loading || state.submitted) return;

    const resolvedCategory =
      state.step === "category" ? resolveCategoryInput(input) : null;
    if (resolvedCategory) {
      dispatch({ type: "SELECT_QUICK_REPLY", payload: resolvedCategory });
      return;
    }

    dispatch({ type: "SEND_MESSAGE", payload: input });
  }, [state]);

  const selectQuickReply = useCallback((value: string) => {
    dispatch({ type: "SELECT_QUICK_REPLY", payload: value });
  }, []);

  const goBack = useCallback(() => {
    dispatch({ type: "GO_BACK" });
  }, []);

  const reset = useCallback(() => {
    submitRef.current = false;
    dispatch({ type: "RESET" });
  }, []);

  const uploadFiles = useCallback((files: File[]) => {
    dispatch({ type: "UPLOAD_FILES", payload: files });
  }, []);

  const removeFile = useCallback((index: number) => {
    dispatch({ type: "REMOVE_FILE", payload: index });
  }, []);

  const prefillCity = useCallback((city: string) => {
    dispatch({ type: "PREFILL_CITY", payload: city });
  }, []);

  const beginRegistration = useCallback((input?: string) => {
    dispatch({ type: "BEGIN_REGISTRATION", payload: input });
  }, []);

  const appendMessage = useCallback((payload: Pick<ChatMessage, "role" | "content" | "quickReplies" | "isSummary">) => {
    dispatch({ type: "APPEND_MESSAGE", payload });
  }, []);

  const submit = useCallback(async () => {
    if (submitRef.current) return;
    submitRef.current = true;
    dispatch({ type: "CONFIRM_SUBMIT" });

    try {
      const { data, documentFiles } = state;
      const uploadedDocs = await uploadSubmissionDocuments(documentFiles);

      const values: Record<string, FormDataEntryValue> = {
        category: data.category ?? "",
        fullname: data.fullname ?? "",
        country: data.country ?? "",
        city: data.city ?? "",
        business: data.business ?? "",
        field: data.field ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        referral_source: data.referral_source ?? "",
        referral_detail: data.referral_detail ?? "",
        referral_code: data.referral_code ?? "",
        offers_needs: data.offers_needs ?? "",
        document_url: uploadedDocs[0]?.url ?? "",
        document_name: uploadedDocs[0]?.name ?? "",
        documents: uploadedDocs as unknown as FormDataEntryValue,
        contest_interest: data.contest_interest ? "yes" : "",
        whatsapp_interest: data.whatsapp_interest ? "yes" : "",
      };

      const payload = toSubmissionInsert(values, "register", data.consent);
      payload.source_type = "chatbot";
      payload.referral_source = payload.referral_source || "ai-chat";
      payload.referral_code = await validateReferralCodeBeforeSubmit(payload.referral_code);
      const { data: inserted, error } = await supabase.from("submissions").insert(payload).select("id").single();
      if (error) throw error;

      try {
        if (inserted?.id) {
          await notifySubmission(inserted.id);
        }
      } catch (notificationError) {
        console.error("Mail notification error:", notificationError);
      }

      dispatch({ type: "SUBMIT_SUCCESS" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "L\u00fctfen tekrar deneyin veya info@corteqs.net adresine yaz\u0131n.";
      submitRef.current = false;
      dispatch({ type: "SUBMIT_ERROR", payload: message });
    }
  }, [state]);

  return {
    state,
    sendMessage,
    selectQuickReply,
    goBack,
    reset,
    uploadFiles,
    removeFile,
    prefillCity,
    beginRegistration,
    appendMessage,
    submit,
  };
}
