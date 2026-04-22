export const getMaxDate = (): string => {
  const currentDate = new Date();
  currentDate.setFullYear(currentDate.getFullYear() + 5);
  return currentDate.toISOString().split("T")[0];
};

export const getMinDate = (): string => {
  const currentDate = new Date();
  return currentDate.toISOString().split("T")[0];
};
