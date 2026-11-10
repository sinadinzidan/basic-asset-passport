# CDF schema for Asset Passport

The Asset Passport **solution data model**. The app reads assets, equipment, notes and documents through it and
writes only notes and documents, only here.

| Space | Holds | Who writes |
| --- | --- | --- |
| `sp-asset-passport` | containers, views, data model | admins and the Toolkit pipeline only |
| `sp-asset-passport-data` | notes and documents (instances) | app users |

`graphql/AssetPassport.graphql` is the schema to paste into the data model editor in Fusion (space
`sp-asset-passport`, external ID `Asset_Passport`). It imports `Asset`, `Equipment` and `PI_Timeseries` from the RMDM solution
model in `sp-dm-idi-rmdm` (external ID `dm_idi_rmdm`, v1) and adds `Note` and `Document`. RMDM is only
referenced, never edited. `Document` is our own file type: it implements `CogniteFile` (with
`CogniteDescribable` and `CogniteSourceable`) and adds an `asset` relation, so the Files API can upload and
download the content of each document node. The app talks to `Asset_Passport` for assets, equipment, timeseries, notes
and documents.

Files that already exist in RMDM are listed read-only beside the documents uploaded here (uploads always go to
`Document`). The app reads RMDM's `Files` view (`sp-dm-idi-rmdm`, v1) directly by reference, so it is **not** part of
this data model: Fusion cannot import it here, because it requires the type to list every interface `CogniteFile`
implements while the import check requires exactly the interfaces the RMDM view implements. Use either this file or the Toolkit module below, not both.

There are two variants of the schema, each marked with a `# Variant:` line at the top. `AssetPassport.graphql` is the
**minimal** one and the one that is published. `AssetPassport.full.graphql` is the **full** one, with the whole
`PI_Timeseries` field set. Publish only one of them.

`modules/asset_passport` is a CDF Toolkit module that deploys the same model: the `Note` and `Document`
containers and views, and the `Asset_Passport` data model that also references RMDM's `Asset`, `Equipment` and `PI_Timeseries`
views (`sp-dm-idi-rmdm`, v1). Move it into your team's Toolkit repository if that is where deployments run.
If you already published the model from the GraphQL file, do not deploy the module over it: both create the
same containers and views.

## Access the app users need

- read the data model in `sp-asset-passport` and the imported views in `sp-dm-idi-rmdm`
  (`dataModelsAcl`), and read the asset and equipment instances (`dataModelInstancesAcl`, scoped to the
  space that holds those nodes);
- read and write instances in `sp-asset-passport-data` (scope the instances ACL to this space). Use WRITE, not
  only WRITE_PROPERTIES: new notes and documents are new instances;
- upload and download document files: the same instances ACL covers the files managed by data modeling;
- see the time series and their readings: read the `PI_Timeseries` nodes with `dataModelInstancesAcl:READ`, scoped to
  the space that holds them. Data modeling governs time series by space, not by data set, so the same READ also
  lets the app read the datapoints (the previews and the trend chart). Without it the series list is empty or the
  readings fail to load. Reading the series through the view also needs `dataModelsAcl:READ` on `cdf_cdm` and on
  `sp-dm-idi-pi`, where the containers behind its fields live, if the schema access is scoped by space. The unit
  (`engunits`) is plain text, so the units space is not needed.
- see the files that already exist for an asset: read the `Files` nodes with `dataModelInstancesAcl:READ`, scoped to
  the space that holds them, and `dataModelsAcl:READ` on `sp-dm-idi-rmdm` and `cdf_cdm` (the app reads the `Files` view
  directly, not through this data model). Opening a
  file for preview also needs read access to its content in that space. Without it the Documents tab shows
  "Existing files could not be loaded" and still lists the documents uploaded in the app.

Creating or changing the schema needs `dataModelsAcl:WRITE`. Do not give that to app users.

The app never creates spaces, containers or views at run time.
