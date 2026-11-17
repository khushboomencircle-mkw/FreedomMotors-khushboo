import {defineField} from 'sanity'

/**
 * Shared "Section Theme" override fields, added to every section's Section Theme
 * group (formerly "Section Style"). `lightTheme`/`darkTheme` are two genuinely
 * separate themeConfig objects (same object type the global Site Theme's
 * lightTheme/darkTheme use), each edited independently — setting a color in one
 * never appears in the other. `sectionThemeMode` picks which one is active,
 * mirroring Site Theme's `defaultMode`. All hidden unless enableSectionTheme is on.
 *
 * Existing `container` / `border` fields stay in the same group untouched — when
 * Section Theme is off and the global theme is off, those legacy styles apply.
 */
export function sectionThemeFields(group = 'sectionStyles') {
  return [
    defineField({
      name: 'enableSectionTheme',
      title: 'Enable Section Theme',
      type: 'boolean',
      group,
      description: 'Gives this section its own theme instead of inheriting the Site Theme.',
      options: {layout: 'switch'},
      initialValue: false,
    }),
    defineField({
      name: 'sectionThemeMode',
      title: 'Section Appearance',
      type: 'string',
      group,
      description: 'Light or Dark appearance for this section.',
      options: {
        list: [
          {title: 'Light', value: 'light'},
          {title: 'Dark', value: 'dark'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'dark',
      hidden: ({parent}) => !parent?.enableSectionTheme,
    }),
    // `lightTheme`/`darkTheme` share the exact same title and are mutually
    // exclusive via `hidden` (keyed off `sectionThemeMode`, not just
    // `enableSectionTheme`) — only one is ever visible at a time, so to
    // the admin this reads as one "Theme Settings" panel whose values
    // change when Section Appearance is toggled, not two parallel
    // sections — same pattern as Site Theme's lightTheme/darkTheme.
    defineField({
      name: 'lightTheme',
      title: 'Theme Settings',
      type: 'themeConfig',
      group,
      description:
        'Colors, fonts, button styles, and corner rounding for this section. Edited independently of Dark — a blank field here falls back to a built-in light default, never a Dark value.',
      hidden: ({parent}) => !parent?.enableSectionTheme || parent?.sectionThemeMode !== 'light',
    }),
    defineField({
      name: 'darkTheme',
      title: 'Theme Settings',
      type: 'themeConfig',
      group,
      description:
        'Colors, fonts, button styles, and corner rounding for this section. Edited independently of Light — a blank field here falls back to a built-in dark default, never a Light value.',
      hidden: ({parent}) => !parent?.enableSectionTheme || parent?.sectionThemeMode === 'light',
    }),
  ]
}
