<img align="right" width="250" height="47" src="./media/Gematik_Logo_Flag.png"/> <br/>      

# Release portal-pathogen

# Release 1.6.5
- Removed data-cy attributes from elements
- Updated @gematik/demis-portal-core-library to 2.3.9
- Fixed vulnerabilities in dependencies
- Adapted gender enum according to openapi model, added gender other x
- Added eslint config and fixed linting issues
- Added possibility to pass staticSystemVersion to gateway
- removed feature flag NEW_API_ENDPOINTS

# Release 1.6.4
- Updated @gematik/demis-portal-core-library to 2.3.8
- Changed info icon in formly templates
- Disabled Sandbox for ChromeHeadless browser to run karma tests in CI
- Updated Base Image to 1.29.4-alpine3.23-slim
- Removed FEATURE_FLAG_PORTAL_PASTEBOX
- Integrated form footer from core library
- Added routing and header for § 7.3 anonymous notification (FEATURE_FLAG_ANONYMOUS_NOTIFICATION)
- Fixed vulnerabilities in dependencies

# Release 1.6.3
- Removed FEATURE_FLAG_PORTAL_ERROR_DIALOG
- Updated @gematik/demis-portal-core-library to 2.3.6
- Updated Angular dependencies to version 19.2.17
- Improved clipboard logic for follow-up notification
- Refined follow-up pop-up dialog text

# Release 1.6.2
- Updated @gematik/demis-portal-core-library to 2.3.3
- Implemented notifiedPersonNotByName config from Portal-Core

# Release 1.6.1
- Removed FEATURE_FLAG_PORTAL_SUBMIT and FEATURE_FLAG_PORTAL_ERROR_DIALOG_ON_SUBMIT
- Implemented HeaderSection from Portal-Core (FEATURE_FLAG_PORTAL_PAGE_STRUCTURE)
- Implemented validation to ensure that the notificationCategory for follow-up notifications matches the selected notificationType
- Updated ngx-formly to 7.0.0
- Implemented notifiedPersonAnonymous config from Portal-Core
- Implemented FollowUpNotificationService from Portal-Core and remove existing one from project
- Updated @gematik/demis-portal-core-library to 2.3.2
- Removed FEATURE_FLAG_PATHOGEN_DATEPICKER
- Updated NGINX-Base-Image to 1.29.3

# Release 1.6.0
- Added GET call to fetch notificationCategory based on notificationId (follow-up)
- Improve UX of autocomplete fields
- Removed FEATURE_FLAG_PORTAL_REPEAT
- Improved enable/disable handling for pathogen and subpathogen selection
- add configmap checksum as annotation to force pod restart on configmap change
- Finalize follow up notification logic and design
- Fix change detection issue for 7.3 notification
- Update @gematik/demis-portal-core-library to 2.2.3
- Add new clipboard key for laboratoryOrderId

# Release 1.5.2
- Use submit- and spinner-dialog from Portal-Core (FEATURE_FLAG_PORTAL_SUBMIT)

# Release 1.5.1
- Fixed a bug, where validation errors where not shown
- Removed a date mapping function in favor of an updated version of the datepicker
- Improved notificationId info text
- Upgraded dependencies
- Added test:coverage npm script to run a single test run with coverage report
- fixed clipboard data bug which disables request for pathogen data based on notificationCategory changes

## Release 1.5.0
- Implementation of §7.1 follow-up notification (FEATURE_FLAG_FOLLOW_UP_NOTIFICATION_PORTAL_PATHOGEN)
- add new API endpoints activated by feature flag FEATURE_FLAG_NEW_API_ENDPOINTS
- add fhirProfile header for futs requests
- Switch to errorDialog from CoreLibrary for submit (FEATURE_FLAG_PORTAL_ERROR_DIALOG_ON_SUBMIT)
- Bugfix for submittingFacility contacts in case of copy checkbox usage

## Release 1.4.7
- Updated Angular version
- Updated Nginx version
- Updated Portal-Core Library version

## Release 1.4.6
- Updated data model

## Release 1.4.5
- Changed inputs to outline style
- Updated Readme license disclaimer
- implementation of §7.3 notification (non nominal)
- include new paste box from core lib
- include new repeat component from core lib

## Release 1.4.4
- Updated Portal-Core Library version

## Release 1.4.3
- Updated Portal-Core Library version
- Updated Nginx version
- New Color Scheme
- Bugfix for Checkbox
- Replaced hardcoded futs path with dynamic path

## Release 1.4.2
- Updated ospo-resources for adding additional notes and disclaimer

## Release 1.4.1
- Add new font and background color

## Release 1.4.0
- First official GitHub-Release
