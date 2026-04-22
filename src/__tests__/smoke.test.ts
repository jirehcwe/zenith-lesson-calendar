describe("jest environment", () => {
  it("runs typescript tests", () => {
    expect(1 + 1).toBe(2);
  });

  it("has jsdom globals available", () => {
    expect(typeof window).toBe("object");
    expect(typeof document).toBe("object");
  });
});
