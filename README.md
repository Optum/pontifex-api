<div id="top"></div>

<!-- NOTES -->
<!--
*** Individual sections below can be removed if not needed
-->

<!-- PROJECT SHIELDS -->
<!--
*** We are using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">

<h3 align="center">pontifex-api</h3>

  <p align="center">
    An Azure Function backend for Pontifex.
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#maintainers">Maintainers</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

The Pontifex API layer abstracts away the interactions with Azure AD and supports actions within the pontifex-ui.

<p align="right">(<a href="#top">back to top</a>)</p>



### Built With

* [Azure Function](https://docs.microsoft.com/en-us/azure/azure-functions/functions-overview)

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

1. Install the [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=v4%2Cmacos%2Ccsharp%2Cportal%2Cbash#install-the-azure-functions-core-tools)
2. Install the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
3. Install Node 16.  I recommend using [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/Optum/pontifex-api.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Create an Azure AD App Registration with the following Application Permissions:
    1. AccessReview.ReadWrite.All
    2. AppCatalog.Read.All
    3. Application.ReadWrite.OwnedBy
    4. AppRoleAssignment.ReadWrite.All
4. Create a CosmosDB Gremlin Instance
5. Update the `local.settings.example.json` with the values from the previous 2 resources and rename it to
   be `local. settings.json`
6. run `npm start`

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- MAINTAINERS -->
## Maintainers

- Alexander Aavang
  - GitHub Enterprise: [aaavang](https://github.com/aaavang)
  - Email: alexander.aavang@optum.com, alex.aavang@gmail.com

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/Optum/pontifex-api.svg?style=for-the-badge
[contributors-url]: https://github.com/Optum/pontifex-api/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/Optum/pontifex-api.svg?style=for-the-badge
[forks-url]: https://github.com/Optum/pontifex-api/network/members
[stars-shield]: https://img.shields.io/github/stars/Optum/pontifex-api.svg?style=for-the-badge
[stars-url]: https://github.com/Optum/pontifex-api/stargazers
[issues-shield]: https://img.shields.io/github/issues/Optum/pontifex-api.svg?style=for-the-badge
[issues-url]: https://github.com/Optum/pontifex-api/issues
[license-shield]: https://img.shields.io/github/license/Optum/pontifex-api.svg?style=for-the-badge
[license-url]: https://github.com/Optum/pontifex-api/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[product-screenshot]: images/screenshot.png
