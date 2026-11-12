import { test } from "node:test";
import assert from "node:assert/strict";
import { visualOrder } from "./rtl-visual";

test("English is left untouched", () => {
  const text = "Kidsit blog";
  assert.equal(visualOrder(text, "ltr"), text);
  assert.equal(visualOrder("Hello, world.", "ltr"), "Hello, world.");
  assert.equal(visualOrder("Toddler Meltdown When Screen Time Ends?", "ltr"), "Toddler Meltdown When Screen Time Ends?");
});

test("pure Hebrew matches a full reverse, which is the visual order", () => {
  const text = "קופיילוט ההורות שלכם";
  assert.equal(visualOrder(text, "rtl"), Array.from(text).reverse().join(""));
  assert.equal(visualOrder("שלום", "rtl"), "םולש");
});

test("mixed Hebrew and Latin keeps Kidsit in order and on the correct side", () => {
  // Logical "בלוג Kidsit" reads with בלוג on the right and Kidsit on the left.
  // The LTR shaper must receive Kidsit first, then the Hebrew letters reversed.
  assert.equal(visualOrder("בלוג Kidsit", "rtl"), "Kidsit גולב");
  assert.notEqual(visualOrder("בלוג Kidsit", "rtl"), Array.from("בלוג Kidsit").reverse().join(""));
  // The other embedding still does not spell Kidsit backwards.
  assert.equal(visualOrder("Kidsit בלוג", "rtl"), "גולב Kidsit");
  assert.equal(visualOrder("Kidsit מול ChatGPT:", "rtl"), ":ChatGPT לומ Kidsit");
  assert.equal(visualOrder("מאמן הורות AI:", "rtl"), ":AI תורוה ןמאמ");
});

test("punctuation and numbers sit at the visual end of a Hebrew line", () => {
  assert.equal(visualOrder("ילד בוכה בפרידה בגן?", "rtl"), "?ןגב הדירפב הכוב דלי");
  assert.equal(visualOrder("התקפי זעם בגיל 3:", "rtl"), ":3 ליגב םעז יפקתה");
  assert.equal(visualOrder("(שלום)", "rtl"), "(םולש)");
});

test("each line is reordered on its own", () => {
  const text = "ילד בוכה בפרידה בגן?\nמשפט פרידה קצר שעובד בבוקר";
  assert.equal(
    visualOrder(text, "rtl"),
    "?ןגב הדירפב הכוב דלי\nרקובב דבועש רצק הדירפ טפשמ",
  );
});
