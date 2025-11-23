/// <reference types="jest" />
import { ItemService } from "../itemService";

describe("ItemService.tokenizeName", () => {
  let service : ItemService;
  const mockCategoryService = {} as any;

  beforeEach(() => {
    service = new ItemService(mockCategoryService);
  });

  it("returns empty array for empty or whitespace-only input", () => {
    expect((service as any).tokenizeName("")).toEqual([]);
    expect((service as any).tokenizeName("   ")).toEqual([]);
  });

  it("splits simple ASCII words and lowercases them", () => {
    expect((service as any).tokenizeName("Hello World")).toEqual([
      "hello",
      "world",
    ]);
  });

  it("collapses multiple spaces between words", () => {
    expect((service as any).tokenizeName(" multiple   spaces ")).toEqual([
      "multiple",
      "spaces",
    ]);
  });

  it("groups ASCII letters/digits together and separates punctuation/symbols", () => {
    expect((service as any).tokenizeName("123abc!@#")).toEqual([
      "123abc",
    ]);
  });

  it("treats latin characters as individual tokens", () => {
    expect((service as any).tokenizeName("Café-au-lait")).toEqual([
      "café",
      "au",
      "lait",
    ]);
  });

  it("handles mixed scripts, grouping trailing ASCII letters", () => {
    expect((service as any).tokenizeName("中文测试abc")).toEqual([
      "中",
      "文",
      "测",
      "试",
      "abc",
    ]);
  });

  it("Words into tokens with any punctuation or symbols", () => {
    expect((service as any).tokenizeName("well-being")).toEqual([
      "well",
      "being",
    ]);
  });


  it("Skip articles and short common words", () => {
    expect((service as any).tokenizeName("The quick brown fox")).toEqual([
      "quick",
      "brown",
      "fox",
    ]);
  });

  it("Removes duplicate tokens", () => {
    expect((service as any).tokenizeName("test test TEST TeSt")).toEqual([
      "test",
    ]);
  });
});
