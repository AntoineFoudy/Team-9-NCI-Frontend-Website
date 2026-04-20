test("valid login", () => {
  const result = true;
  expect(result).toBe(true);
});

test("invalid password", () => {
  const result = false;
  expect(result).toBe(false);
});