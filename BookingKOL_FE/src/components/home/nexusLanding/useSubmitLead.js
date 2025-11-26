import {
  submitClientContact,
  submitKolContact,
} from "../../../services/contact/ContactServices";

export const useSubmitLead = () => {
  const submitLead = async ({ type, payload } = {}) => {
    if (type === "client") {
      return submitClientContact(payload);
    }

    if (type === "kol") {
      return submitKolContact(payload);
    }

    throw new Error("Unsupported lead form type");
  };

  return { submitLead };
};
