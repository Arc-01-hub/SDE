export const isLoggedIn = () => {
  return !!localStorage.getItem("authToken");
};

export const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};
