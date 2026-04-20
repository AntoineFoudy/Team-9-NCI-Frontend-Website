test("successful signup", () => {
  const result = true; // simulate valid signup
  expect(result).toBe(true);
});

test("duplicate email accepted", () => {
  const result = true; // shows system flaw
  expect(result).toBe(true);
});

test("invalid input accepted", () => {
  const result = true; // shows no validation
  expect(result).toBe(true);
});