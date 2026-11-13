import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const style = JSON.parse(readFileSync(new URL("../src/data/streetMapStyle.json", import.meta.url), "utf8"));

test("map areas have explicit light colors instead of the renderer's black default", () => {
  const polygons = style.layers.filter((layer) => layer.type === "fill");
  assert.ok(polygons.length > 0);
  for (const layer of polygons) {
    const color = layer.paint?.["fill-color"];
    assert.match(color || "", /^#[0-9a-f]{6}$/i, `${layer.id} needs an explicit color`);
    const channels = color.slice(1).match(/../g).map((channel) => parseInt(channel, 16));
    assert.ok(Math.min(...channels) >= 160, `${layer.id} must not create a dark field`);
    assert.equal(layer.paint["fill-pattern"], undefined, `${layer.id} must not depend on a texture`);
  }
});

test("pedestrian areas stay flat and buildings remain visible through close zooms", () => {
  const pedestrian = style.layers.find((layer) => layer.id === "pedestrian-area");
  assert.equal(pedestrian.type, "fill");
  assert.equal(style.layers.some((layer) => layer.type === "fill-extrusion"), false);
  const buildings = style.layers.find((layer) => layer.id === "building");
  assert.equal(buildings.type, "fill");
  assert.ok(buildings.maxzoom > 20);
});

test("destination labels include libraries and campus facilities regardless of rank", () => {
  const destinations = style.layers.find((layer) => layer.id === "campus-destinations");
  assert.equal(destinations["source-layer"], "poi");
  assert.ok(destinations.minzoom <= 16);
  const filter = JSON.stringify(destinations.filter);
  for (const category of ["library", "college", "office", "dormitory"]) {
    assert.ok(filter.includes(`"${category}"`), `${category} destinations must be included`);
  }
  assert.equal(filter.includes('"rank"'), false, "rank must not hide named campus destinations");
  assert.equal(destinations.layout["text-allow-overlap"], false);
  assert.ok(JSON.stringify(destinations.layout["text-field"]).includes("name:vi"));
  assert.ok(style.layers.some((layer) => layer["source-layer"] === "housenumber"));
});
