'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AdditionalGroup } from '@/components/dashboard/resume-component';
import { createAdditionalGroupId } from '@/lib/utils/additional-groups';
import { useTranslations } from '@/lib/i18n';

interface AdditionalGroupsEditorProps {
  groups: AdditionalGroup[];
  onChange: (groups: AdditionalGroup[]) => void;
}

/**
 * AdditionalGroupsEditor Component
 *
 * Add/rename/remove freeform named sub-lists (e.g. "Publications", "Volunteer
 * Work", another "Languages" group). Shared by the Skills & Awards form and
 * any stringList custom section, so both get the same sub-grouping ability.
 */
export const AdditionalGroupsEditor: React.FC<AdditionalGroupsEditorProps> = ({
  groups,
  onChange,
}) => {
  const { t } = useTranslations();

  const handleAddGroup = () => {
    onChange([...groups, { id: createAdditionalGroupId(), label: '', items: [] }]);
  };

  const handleRemoveGroup = (id: string) => {
    onChange(groups.filter((group) => group.id !== id));
  };

  const handleLabelChange = (id: string, label: string) => {
    onChange(groups.map((group) => (group.id === id ? { ...group, label } : group)));
  };

  const handleItemsChange = (id: string, value: string) => {
    // Split by newlines only; blank lines are preserved while editing so
    // pressing Enter creates a new line (issue #763).
    const items = value.split('\n');
    onChange(groups.map((group) => (group.id === id ? { ...group, items } : group)));
  };

  // Explicitly allow Enter key to create newlines (prevent form submission interference)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  };

  const formatItems = (items?: string[]) => items?.join('\n') || '';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="font-mono text-xs uppercase tracking-wider text-steel-grey">
          {t('builder.additionalForm.additionalSectionsLabel')}
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddGroup}
          className="rounded-none border-black hover:bg-black hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" /> {t('builder.additionalForm.addSection')}
        </Button>
      </div>

      {groups.length === 0 ? (
        <p className="font-mono text-xs text-steel-grey">
          {t('builder.additionalForm.additionalSectionsEmpty')}
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.id} className="p-4 border border-black bg-paper-tint relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleRemoveGroup(group.id)}
                aria-label={t('a11y.removeItem')}
                title={t('a11y.removeItem')}
              >
                <Trash2 className="w-4 h-4" />
              </Button>

              <div className="space-y-2 pr-10 mb-3">
                <Label className="font-mono text-xs uppercase tracking-wider text-steel-grey">
                  {t('builder.additionalForm.sectionNameLabel')}
                </Label>
                <Input
                  value={group.label}
                  onChange={(e) => handleLabelChange(group.id, e.target.value)}
                  placeholder={t('builder.additionalForm.sectionNamePlaceholder')}
                  className="rounded-none border-black bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider text-steel-grey">
                  {t('builder.additionalForm.sectionItemsLabel')}
                </Label>
                <Textarea
                  value={formatItems(group.items)}
                  onChange={(e) => handleItemsChange(group.id, e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('builder.additionalForm.sectionItemsPlaceholder')}
                  className="min-h-[100px] text-black rounded-none border-black bg-white focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-700"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
