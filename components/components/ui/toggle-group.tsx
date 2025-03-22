import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/components/lib/utils";
import { toggleVariants } from "@/components/components/ui/toggle";
import { ArrowLeft, ArrowRight } from "lucide-react";

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "lg",
  variant: "default",
});

function ToggleGroup({
  className,
  variant,
  size,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  // Check scroll position to determine if arrows are needed
  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth);
    }
  };

  // Scroll left
  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  // Scroll right
  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  React.useEffect(() => {
    checkScroll();
    if (containerRef.current) {
      containerRef.current.addEventListener("scroll", checkScroll);
    }
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("scroll", checkScroll);
      }
    };
  }, []);

  return (
    <div className="relative flex items-center group">
      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={scrollLeft}
          className="sm:hidden group-hover:block hover:bg-gray-200 bg-gray-100 cursor-pointer text-gray-800 absolute  z-10 !p-3 rounded-full"
        >
          <ArrowLeft />
        </button>
      )}

      {/* Toggle Group */}
      <div
        ref={containerRef}
        className={cn(
          "group/toggle-group flex gap-8 items-center overflow-x-auto scrollbar-none  rounded-md",
          className
        )}
      >
        <ToggleGroupPrimitive.Root
          data-slot="toggle-group"
          data-variant={variant}
          data-size={size}
          className="flex gap-2 whitespace-nowrap scrollbar-none"
          {...props}
        >
          <ToggleGroupContext.Provider value={{ variant, size }}>
            {children}
          </ToggleGroupContext.Provider>
        </ToggleGroupPrimitive.Root>
      </div>

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          type="button"
          onClick={scrollRight}
          className="sm:hidden group-hover:block hover:bg-gray-200 bg-gray-100 cursor-pointer text-gray-800 absolute right-0 z-10 !p-3 rounded-full "
        >
          <ArrowRight />
        </button>
      )}
    </div>
  );
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        "border border-border cursor-pointer min-w-[100px] w-fit flex-1 shrink-0  focus-visible:z-10",
        "hover:bg-[#1DA1F2] hover:text-white", // Updated hover color
        "data-[state=on]:bg-[#0b92e6] data-[state=on]:text-white", // Updated active color
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}

export { ToggleGroup, ToggleGroupItem };
