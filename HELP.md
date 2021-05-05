## devops access page:

https://dev.azure.com/calebmackey/esri-loader-typings-helper

## commit
commit changes as normal using the commitizen cli, and then run `standard-release`.  Once the new release has been created, the extension can be published.

```sh
npm run release
```

## publish
to publish, run the `vsce publish` command:

```sh
vsce publish <verison-num>
```

### Invalid or Expired Token Error
if getting a 401 error during the publishing process the token may be expired.  To fix this, generate a  new token and **make sure to select "All Accessible Organizations" in the field dropdown**.  See the [help page](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#i-get-403-forbidden-or-401-unauthorized-error-when-i-try-to-publish-my-extension) for more information.