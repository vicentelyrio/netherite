# Contributing
When contributing to this repository, please first discuss the change you wish to make via issue with the owners of this repository before making a change.

Please note we have a [code of conduct](https://github.com/yuca-live/yuca-components/blob/master/CODE_OF_CONDUCT.md), please follow it in all your interactions with the project.

#### Pull Request Process

Update the [README](https://github.com/yuca-live/yuca-components/blob/master/README.md) with details of changes to the interface.

This project uses [commitizen](https://github.com/commitizen/cz-cli) and [semantic-release](https://github.com/semantic-release/semantic-release) to manage versioning. Please, follow [conventional commits](https://www.conventionalcommits.org/en/v1.0.0-beta.2/) pattern to ensure a good versioning of your change.

A release is done only when your commit fallows the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0-beta.2/) pattern, which has the follow format:

```
fix(context): Message
```

eg:

```
fix(button): Fixing button shadows
```

```
feat(321): Including new icon
```

Commits tagged with `fix` will create a `patch` version and with `feat` will create a `minor` version. Major versions will be created when any commit is tagged as `BREAKING CHANGE`.
