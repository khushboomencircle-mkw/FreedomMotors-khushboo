import {
  typographyConfigType,
  borderConfigType,
  containerConfigType,
  cardStyleConfigType,
  textShadowConfigType,
  themeConfigType,
  photoWithAltType,
  seoType,
  linkEndpointType,
} from './objects'
import {
  announcementBarType,
  headerNavigationMenuType,
  userProfileMenuType,
  headerCtaType,
  headerCustomContentType,
} from './headerSectionType'
import {
  footerColumnType,
  newsletterSectionType,
  socialLinksSectionType,
  copyrightSectionType,
  footerRichTextType,
} from './footerSectionType'
import {siteSettingsType} from './siteSettingsType'
import {navigationLinkType} from './navigationLinkType'
import {navigationSettingsType} from './navigationSettingsType'

import {sectionObjectTypes} from './sections'
import {applyLayoutPickers} from '../layoutPresets'
import {applySectionLibrary} from '../sectionLibrary'
import {convertVehicle2PageType} from './pages/convertVehicle2Page'
import {driverPage} from './pages/driver'
import {commercialPage} from './pages/commercialPage'
import {ourStoryPage} from './pages/ourStoryPage'
import {contactPage} from './pages/contactPage'
import {educationalPage} from './pages/educationalPage'
import {educationalArticleType} from './pages/educationalArticle'
import {blogPostType} from './pages/blogPost'
import {vehiclesPage} from './pages/vehiclesPage'
import {vehicleDetailPage} from './pages/vehicleDetailPage'
import {homePage} from './pages/homePage'
import {vehicleType} from './vehicleType'
import {customPage} from './customPage'
import {megaMenuConfigType} from './megaMenuConfigType'
import {redirectType} from './redirectType'
import {categoryType} from './category'
import {pageTemplateType} from '../pageTemplateLibrary/pageTemplateType'

// The section library (visual "Add section" menu + empty starting rows) is applied once, over the whole list,
// so no page or section file is edited. Switch it off with SECTION_LIBRARY_ENABLED in studio/sectionLibrary.
export const schemaTypes = applySectionLibrary([
  // Document types
  siteSettingsType,
  navigationSettingsType,

  // Navigation link item (used inside navigationSettings)
  navigationLinkType,

  // Page types
  convertVehicle2PageType,
  driverPage,
  commercialPage,
  ourStoryPage,
  contactPage,
  educationalPage,
  vehiclesPage,
  vehicleDetailPage,
  homePage,

  // Reusable object types
  linkEndpointType,
  seoType,
  typographyConfigType,
  borderConfigType,
  containerConfigType,
  cardStyleConfigType,
  textShadowConfigType,
  themeConfigType,
  photoWithAltType,

  // Section types (cards grid, FAQ accordion, banner, + child items)
  // The layout picker is added here, on registration, so the section files themselves are untouched.
  ...applyLayoutPickers(sectionObjectTypes),

  customPage,
  vehicleType,
  educationalArticleType,
  blogPostType,
  megaMenuConfigType,
  redirectType,
  categoryType,
  pageTemplateType,

  // Header content sections
  announcementBarType,
  headerNavigationMenuType,
  userProfileMenuType,
  headerCtaType,
  headerCustomContentType,

  // Footer content sections
  footerColumnType,
  newsletterSectionType,
  socialLinksSectionType,
  copyrightSectionType,
  footerRichTextType,
])
