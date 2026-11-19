/**
 * Section Types Registry
 *
 * All reusable page section types and their child item types.
 *
 * To add a new section type:
 * 1. Create a new file in this folder (e.g. testimonialSection.ts)
 * 2. Export the type here
 * 3. Add it to `sectionObjectTypes` and `allSectionMembers`
 */
import {defineArrayMember} from 'sanity'

import {cardItemType} from './cardItem'
import {accordionItemType} from './faqItem'
import {cardsGridSectionType} from './cardsGridSection'
import {accordionSectionType} from './faqAccordionSection'
import {bannerSectionType} from './bannerSection'
import {featureCardItemType} from './featureCardItem'
import {featureGridSectionType} from './featureGridSection'
import {linkListItemType} from './linkListItem'
import {linkListSectionType} from './linkListSection'
import {customHtmlSectionType} from './customHtmlSection'
import {googleReviewsSectionType} from './googleReviewsSection'
import {staticSectionType} from './staticSection'
import {photoGallerySectionType} from './photoGallerySection'
import {callToActionSectionType} from './callToActionSection'
import {vehicleCarouselSectionType} from './vehicleCarouselSection'
import {testimonialItemType} from './testimonialItem'
import {testimonialsSectionType} from './testimonialsSection'

export {cardItemType} from './cardItem'
export {accordionItemType} from './faqItem'
export {cardsGridSectionType} from './cardsGridSection'
export {accordionSectionType} from './faqAccordionSection'
export {bannerSectionType} from './bannerSection'
export {featureCardItemType} from './featureCardItem'
export {featureGridSectionType} from './featureGridSection'
export {linkListItemType} from './linkListItem'
export {linkListSectionType} from './linkListSection'
export {customHtmlSectionType} from './customHtmlSection'
export {googleReviewsSectionType} from './googleReviewsSection'
export {staticSectionType} from './staticSection'
export {photoGallerySectionType} from './photoGallerySection'
export {callToActionSectionType} from './callToActionSection'
export {vehicleCarouselSectionType} from './vehicleCarouselSection'
export {testimonialItemType} from './testimonialItem'
export {testimonialsSectionType} from './testimonialsSection'

/** All object types that must be registered in the global schema. */
export const sectionObjectTypes = [
  cardItemType,
  accordionItemType,
  cardsGridSectionType,
  accordionSectionType,
  bannerSectionType,
  featureCardItemType,
  featureGridSectionType,
  linkListItemType,
  linkListSectionType,
  customHtmlSectionType,
  googleReviewsSectionType,
  staticSectionType,
  photoGallerySectionType,
  callToActionSectionType,
  vehicleCarouselSectionType,
  testimonialItemType,
  testimonialsSectionType,
]

/**
 * Drop-in array members for a page's `sections` field.
 *
 * Usage:
 *   import { allSectionMembers } from '../sections'
 *   defineField({ name: 'sections', type: 'array', of: allSectionMembers })
 */
export const allSectionMembers = [
  defineArrayMember({type: 'cardsGridSection'}),
  defineArrayMember({type: 'accordionSection'}),
  defineArrayMember({type: 'bannerSection'}),
  defineArrayMember({type: 'featureGridSection'}),
  defineArrayMember({type: 'linkListSection'}),
  defineArrayMember({type: 'customHtmlSection'}),
  defineArrayMember({type: 'googleReviewsSection'}),
  defineArrayMember({type: 'staticSection'}),
  defineArrayMember({type: 'photoGallerySection'}),
  defineArrayMember({type: 'callToActionSection'}),
  defineArrayMember({type: 'vehicleCarouselSection'}),
  defineArrayMember({type: 'testimonialsSection'}),
]

export const driverSections = [
  defineArrayMember({type: 'bannerSection'}),
  defineArrayMember({type: 'accordionSection'}),
  defineArrayMember({type: 'cardsGridSection'}),
  defineArrayMember({type: 'featureGridSection'}),
  defineArrayMember({type: 'linkListSection'}),
  defineArrayMember({type: 'staticSection'}),
]
