/// <reference types="jest" />
import { ItemService } from "../itemService";

import {
  Item,
  Location,
  LocationInput,
  ItemCondition,
  ItemStatus,
  Language,
  User,
  Role,
} from "../generated/graphql";

import { CONTENT_RATING_CENSOR_THRESHOLD } from "../contentRatingDefaults";

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
    expect((service as any).tokenizeName("The Lion, the Witch and the Wardrobe")).toEqual([
      "lion",
      "witch",
      "wardrobe",
    ]);
  });

  it("Removes duplicate tokens", () => {
    expect((service as any).tokenizeName("test test TEST TeSt")).toEqual([
      "test",
    ]);
  });
});


describe("ItemService.shouldCensorItem", () => {
  let service : ItemService;
  const mockCategoryService = {} as any;

  // Test Defaults - visible by default.
  // Owner, holder, user all different.
    let item = null as any;
    let user = null as any;

  function censorItems(){
    item.contentRating = 3;
    user.visibleContentRating = 2;
  }

  // Reset values
  beforeEach(() => {
    service = new ItemService(mockCategoryService);

    item = {
      ownerId : "1",
      holderId : "2",
      contentRating: 2,
    } as any;
    user = {
      id : "3",
      visibleContentRating : 3,
    } as any;

  });

  it("Show users items below or at visible content rating", () => {
    item.contentRating = 2;
    user.visibleContentRating = 2;

    expect((service as any).shouldCensorItem(item, user)).toEqual(false);
  });

  it("Hide from users items above visible content rating", () => {
    censorItems();

    expect((service as any).shouldCensorItem(item, user)).toEqual(true);
  });

  it ("Apply default content rating threshold for unauthenticated users", () => {
      item.contentRating = CONTENT_RATING_CENSOR_THRESHOLD - 1;
      expect((service as any).shouldCensorItem(item, null)).toEqual(false);

      item.contentRating = CONTENT_RATING_CENSOR_THRESHOLD;
      expect((service as any).shouldCensorItem(item, null)).toEqual(true);
  });

  it("Show users their own items regardless of content rating", () => {
    censorItems();
    item.ownerId = "1";
    user.id = "1";

    expect((service as any).shouldCensorItem(item, user)).toEqual(false);
  });

  it("Show holders items regardless of content rating", () => {
    censorItems();
    item.ownerId = "2";
    item.holderId = "1";
    user.id = "1";

    expect((service as any).shouldCensorItem(item, user)).toEqual(false);
  });

  it("Show admin all items regardless of content rating", () => {
    censorItems();
    item.ownerId = "1";
    user.id = "2";
    user.role = Role.Admin;

    expect((service as any).shouldCensorItem(item, user)).toEqual(false);
  });

  it("Show all items when bypass is true", () => {
    censorItems();
    item.ownerId = "1";
    user.id = "2";

    expect((service as any).shouldCensorItem(item, user)).toEqual(false);
  });

  it("Shadow ban test - basic test", () => {
    // Shadow ban items that are not censored
    item.shadowBanned = true;
    expect((service as any).shouldCensorItem(item, user)).toEqual(true);
  });

  it("Shadow ban test - item visible to owner", () => {
    item.ownerId = "1";
    user.id = "1";

    item.shadowBanned = true;
    expect((service as any).shouldCensorItem(item, user)).toEqual(false);
  });  

  it("Shadow ban test - item visible to holder", () => {
    item.holderId = "2";
    user.id = "2";

    item.shadowBanned = true;
    expect((service as any).shouldCensorItem(item, user)).toEqual(false);
  });

  it("Shadow ban test - item visible to admin", () => {
    user.role = Role.Admin;

    item.shadowBanned = true;
    expect((service as any).shouldCensorItem(item, user)).toEqual(false);
  });  

});
