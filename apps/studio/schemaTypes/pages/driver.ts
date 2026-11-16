import { defineType, defineField } from "sanity";
import { driverSections } from "../sections";
import { pageChromeFieldsets, pageChromeFields } from "../fields/pageChrome";
import { sectionsArrayValidation } from "../fields/sectionFields";
import { richTextOf } from "../fields/richText";

export const driverPage = defineType({
    name: 'driver',
    title: 'Driver Page',
    type: 'document',
    fieldsets: [...pageChromeFieldsets],
    fields: [
        defineField({
            name: 'pageTitle',
            fieldset: 'pageInfo',
            title: 'Page Title',
            type: 'string',
            initialValue: 'Convert Your Vehicle',
        }),
        defineField({
            name: 'pageDescription',
            fieldset: 'pageInfo',
            title: 'Page Description',
            type: 'array',
            of: richTextOf,
        }),
        ...pageChromeFields,
        defineField({
            name: 'seo',
            title: 'SEO',
            type: 'seo',
            fieldset: 'seoSettings',
        }),
        defineField({
            name: 'sections',
            title: 'Sections',
            type: 'array',
            of: driverSections,
            validation: sectionsArrayValidation,
        }),
    ],
    preview: {
        prepare() {
            return {
                title: 'Driver',
            }
        }
    }
})