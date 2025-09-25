import Api from "../Api";

export async function saveContact(body) {
  console.log("here??");
  const response = await Api.post("/contacts", {
    body,
  });
  console.log(response);
  return response;
}

export async function getContactByMobile({ mobileNumber }) {
  const response = await Api.get(`/contacts`, {
    search: `mobileNumber:${mobileNumber}`,
  });
  return response;
}
