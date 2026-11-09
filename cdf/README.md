# CDF schema for Asset Passport

The Asset Passport **solution data model**. The app reads assets, equipment and notes through it and writes
only notes, only here.

| Space | Holds | Who writes |
| --- | --- | --- |
| `sp-asset-passport` | containers, views, data model | admins and the Toolkit pipeline only |
| `sp-asset-passport-data` | notes (instances) | app users |

`graphql/AssetPassport.graphql` is the schema to paste into the data model editor in Fusion (space
`sp-asset-passport`, external ID `Asset_Passport`). It imports `Asset` and `Equipment` from the RMDM solution
model in `sp-dm-idi-rmdm` (external ID `dm_idi_rmdm`, v1) and adds `Note`. RMDM is only referenced, never
edited. The app talks to `Asset_Passport` for assets, equipment and notes. Use either this file or the
Toolkit module below, not both.

`modules/asset_passport` is a CDF Toolkit module. Move it into your team's Toolkit repository if that is where
deployments run, and set `asset_view_version` in its config to the version of the domain `Asset` view.

## Access the app users need

- read the data model in `sp-asset-passport` and the imported views in `sp-dm-idi-rmdm`
  (`dataModelsAcl`), and read the asset and equipment instances (`dataModelInstancesAcl`, scoped to the
  space that holds those nodes);
- read and write instances in `sp-asset-passport-data` (scope the instances ACL to this space). Use WRITE, not
  only WRITE_PROPERTIES: new notes are new instances.

Creating or changing the schema needs `dataModelsAcl:WRITE`. Do not give that to app users.

The app never creates spaces, containers or views at run time.
