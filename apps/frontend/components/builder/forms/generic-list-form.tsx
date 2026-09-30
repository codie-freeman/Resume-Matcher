'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AdditionalGroup } from '@/components/dashboard/resume-component';
import { AdditionalGroupsEditor } from './additional-groups-editor';
import { useTranslations } from '@/lib/i18n';

interface GenericListFormProps {
  items: string[];
  onChange: (items: string[]) => void;
  label?: string;
  placeholder?: string;
  additionalGroups?: AdditionalGroup[];
  onGroupsChange?: (groups: AdditionalGroup[]) => void;
}

/**
 * Generic List Form Component
 *
 * Used for STRING_LIST type sections (like Skills). Renders a textarea where
 * items are separated by newlines, plus (when onGroupsChange is provided) the
 * same "+ Add Section" sub-grouping ability as the Skills & Awards form, so a
 * custom stringList section can hold multiple named sub-lists too.
 */
export const GenericListForm: React.FC<GenericListFormProps> = ({
  items,
  onChange,
  label,
  placeholder,
  additionalGroups,
  onGroupsChange,
}) => {
  const { t } = useTranslations();
  const finalLabel = label ?? t('builder.customSections.itemsLabel');
  const finalPlaceholder = placeholder ?? t('builder.customSections.itemsPlaceholder');

  const handleChange = (value: string) => {
    // Split by newlines, filter empty lines
    const newItems = value.split('\n').filter((item) => item.trim() !== '');
    onChange(newItems);
  };

  const formatItems = (arr?: string[]) => {
    return arr?.join('\n') || '';
  };

  // Explicitly allow Enter key to create newlines
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="font-mono text-xs uppercase tracking-wider text-steel-grey">
          {finalLabel}
        </Label>
        <p className="font-mono text-xs uppercase tracking-wider text-blue-700 mb-2">
          {t('builder.additionalForm.instructions')}
        </p>
        <Textarea
          value={formatItems(items)}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={finalPlaceholder}
          className="min-h-[100px] text-black rounded-none border-black bg-white focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-700"
        />
      </div>

      {onGroupsChange && (
        <div className="pt-4 border-t border-black">
          <AdditionalGroupsEditor groups={additionalGroups ?? []} onChange={onGroupsChange} />
        </div>
      )}
    </div>
  );
};
