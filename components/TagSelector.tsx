"use client";

import React from "react";
import { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group";

export const TagSelector = React.memo(
  ({
    tags,
    handleSubmitTag,
  }: {
    tags: string[];
    handleSubmitTag: (
      e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => void;
  }) => {
    return (
      <div className="tagArea overflow-x-auto whitespace-nowrap">
        <ToggleGroup type="single" className="inline-flex gap-2">
          {tags.map((tag) => (
            <ToggleGroupItem
              size="default"
              key={tag}
              value={tag}
              onClick={handleSubmitTag}
            >
              {tag}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    );
  }
);
