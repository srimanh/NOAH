import { test } from "node:test";
import assert from "node:assert/strict";
import { classify } from "./policy.js";

const bash = (command: string) => classify("bash", { command });

test("policy: all four Linux package managers require confirmation", () => {
  assert.equal(bash("apt-get install htop").action, "confirm");
  assert.equal(bash("dnf install htop").action, "confirm");
  assert.equal(bash("zypper install htop").action, "confirm");
  // pacman uses flags, not words — must still be caught
  assert.equal(bash("pacman -S htop").action, "confirm");
  assert.equal(bash("pacman -Rns htop").action, "confirm");
  assert.equal(bash("pacman -Syu").action, "confirm");
});

test("policy: read-only package queries stay allowed", () => {
  assert.equal(bash("brew list").action, "allow");
  assert.equal(bash("pacman -Q").action, "allow");
});

test("policy: service tool is a mutating tool -> confirm", () => {
  assert.equal(classify("service", { action: "start", name: "nginx" }).action, "confirm");
});

test("policy: status-type service via systemctl bash still gated (systemctl listed)", () => {
  assert.equal(bash("systemctl restart nginx").action, "confirm");
});

test("policy: catastrophic still hard-denied", () => {
  assert.equal(bash("rm -rf /").action, "deny");
  assert.equal(bash("mkfs.ext4 /dev/sda1").action, "deny");
});
