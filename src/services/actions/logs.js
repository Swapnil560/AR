import Api from "../Api";

export async function saveLogs(body) {
  console.log("here??");
  const response = await Api.post("/log-datas", {
    body,
  });
  console.log(response);
  return response;
}
