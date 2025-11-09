import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../data/constants";
import { getItem } from "../utils/localstorage";

export function useCurrentUser() {
  const token = getItem(ACCESS_TOKEN);
  if (!token) {
    return null;
  }
  const decoded = jwtDecode(token);
  return decoded;
}
