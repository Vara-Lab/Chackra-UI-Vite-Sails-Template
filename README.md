## Vite-Template

To install the dependencies you put "yarn" in the console, and to run it you use "yarn start"

In order to use the example, the following must be followed:

1. First you need to have the name and mnemonic of the wallet (account) which will pay for the creation of vouchers, etc.
2. In the file within "src/app/consts.ts", you will have to put the data obtained from the account that will cover the payments.
3. The information will have to be put on lines 23 and 24:

```javascript
export const sponsorName = "";
export const sponsorMnemonic = "";
```

> Note: The template contains a sponsor example that contains tokens, for your dApp, you need to put a sponsor name and a sponsor mnemonic

4. With this, you can now use the example in the template.
5. You can try the frontend template on gitpod!

<p align="center">
  <a href="https://gitpod.io/#https://github.com/Vara-Lab/Chackra-UI-Vite-Sails-Template.git" target="_blank">
    <img src="https://gitpod.io/button/open-in-gitpod.svg" width="240" alt="Gitpod">
  </a>
</p>
