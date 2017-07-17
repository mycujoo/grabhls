# grabhls - Small utility to save an HLS VOD straight to external (or local storage)
---------------------------------------

## Features

* Stream a HLS VOD straight to Amazon S3
* Modular setup, easily extensible
* Small, compact CLI utility

## Installation

### Using Docker
```
$ docker pull mycujoo/grabhls
$ echo "alias grabhls=\"docker run -it mycujoo/grabhls\"" >> ~/.bash_aliases

# or if you use zsh
$ echo "alias grabhls=\"docker run -it mycujoo/grabhls\"" >> ~/.zshrc
```

### Using npm

```
$ npm install -g grabhls
```

## Usage

### Uploading to S3

Create a .env file for AWS credentials (or specify them in your .bashrc or .zshrc)

```
# Access to AWS S3
AWS_ACCESS_KEY_ID=AKIAXXXXX
AWS_SECRET_ACCESS_KEY=XXXXXX

```

## Contributing
Todo
