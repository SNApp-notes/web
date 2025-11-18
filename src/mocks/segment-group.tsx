import React from 'react';

interface SegmentGroupRootProps {
  value: string;
  onValueChange: (details: { value: string }) => void;
  size?: string;
  children: React.ReactNode;
}

interface SegmentGroupItemProps {
  value: string;
  p?: number;
  children: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
}

// Mock implementation of Chakra UI's SegmentGroup that uses raw HTML
const SegmentGroupRoot = ({ value, onValueChange, children }: SegmentGroupRootProps) => {
  const handleClick = (itemValue: string) => {
    if (itemValue !== value) {
      onValueChange({ value: itemValue });
    }
  };

  return (
    <div
      role="radiogroup"
      data-testid="segment-group"
      style={{
        display: 'flex',
        border: '1px solid #e2e8f0',
        borderRadius: '4px',
        overflow: 'hidden'
      }}
    >
      {React.Children.map(children, (child) => {
        if (
          React.isValidElement<SegmentGroupItemProps>(child) &&
          child.type === SegmentGroupItem
        ) {
          return React.cloneElement(child as React.ReactElement<SegmentGroupItemProps>, {
            onClick: () => handleClick(child.props.value),
            isActive: child.props.value === value
          });
        }
        return child;
      })}
    </div>
  );
};

const SegmentGroupItem = ({
  value,
  children,
  onClick,
  isActive
}: SegmentGroupItemProps) => {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isActive}
      data-value={value}
      data-state={isActive ? 'checked' : 'unchecked'}
      onClick={onClick}
      style={{
        padding: '8px 16px',
        border: 'none',
        background: isActive ? '#3182ce' : 'transparent',
        color: isActive ? 'white' : 'inherit',
        cursor: 'pointer',
        flex: 1
      }}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // Skip Indicator and HiddenInput, render ItemText content
          const childType = child.type as
            | typeof SegmentGroupItemText
            | typeof SegmentGroupIndicator
            | typeof SegmentGroupItemHiddenInput;
          if (childType === SegmentGroupItemText) {
            return (child.props as { children: React.ReactNode }).children;
          }
          if (
            childType === SegmentGroupIndicator ||
            childType === SegmentGroupItemHiddenInput
          ) {
            return null;
          }
        }
        return child;
      })}
    </button>
  );
};

const SegmentGroupItemText = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const SegmentGroupItemHiddenInput = () => null;

const SegmentGroupIndicator = () => null;

export const SegmentGroup = {
  Root: SegmentGroupRoot,
  Item: SegmentGroupItem,
  ItemText: SegmentGroupItemText,
  ItemHiddenInput: SegmentGroupItemHiddenInput,
  Indicator: SegmentGroupIndicator
};
