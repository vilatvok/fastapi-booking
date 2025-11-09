import { ACCESS_TOKEN, REFRESH_TOKEN } from "../data/constants";


export function setAuthTokens(accessToken, refreshToken) {
  localStorage.setItem(ACCESS_TOKEN, accessToken);
  localStorage.setItem(REFRESH_TOKEN, refreshToken);
}

export function setItem(key, value) {
  localStorage.setItem(key, value);
}

export function getItem(key) {
  return localStorage.getItem(key);
}

export function clearStorage() {
  localStorage.clear();
}