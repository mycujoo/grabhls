# grabhls - Small utility to save an HLS VOD straight to external (or local storage)
---------------------------------------

[![CircleCI](https://circleci.com/gh/mycujoo/grabhls.svg?style=svg)](https://circleci.com/gh/mycujoo/grabhls)
[![codecov](https://codecov.io/gh/mycujoo/grabhls/branch/master/graph/badge.svg)](https://codecov.io/gh/mycujoo/grabhls)

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

To generate a cuid for the output filename you can add {random} to the -o/--output option:

-o some-filename-{random}.mp4 => some-filename-cj5c5veaf0000q0ygcogqwl4a.mp4

### Uploading to GCS

Configure your `.env` to have a `GOOGLE_CLOUD_PROJECT_ID` much like the `.env.sample`.

You also should be authenticated, and you can do that with `gcloud auth application-default login`.

#### Module Options

| Option        | Effect                              | Default value | Value                                         |
|---------------|-------------------------------------|---------------|-----------------------------------------------|
| bucket        | Specifies the destination gcs bucket | none          | string                                        |
| acl           | Changes permission for accessing the file                                | private       | [List here](https://cloud.google.com/storage/docs/access-control/lists#predefined-acl)                                            |
| gzip | Enables or disables gzip compression         | true   | Boolean |
| validation | Uses a file validation method | false | false, md5, crc32c |
| content_type  | Specifies the content type          | video/mp4     | string                                        |


### Uploading to S3

Create a .env file for AWS credentials (or specify them in your .bashrc or .zshrc)

```
# Access to AWS S3
AWS_ACCESS_KEY_ID=AKIAXXXXX
AWS_SECRET_ACCESS_KEY=XXXXXX

```

#### Module options

| Option        | Effect                              | Default value | Value                                         |
|---------------|-------------------------------------|---------------|-----------------------------------------------|
| bucket        | Specifies the destination s3 bucket | none          | string                                        |
| acl           | null                                | private       | No                                            |
| storage_class | Specifies the storage class         | STANDARD_IA   | STANDARD or STANDARD_IA or REDUCED_REDUNDANCY |
| content_type  | Specifies the content type          | video/mp4     | string                                        |

```
# Grab an HLS source and output it directly to an S3 bucket
$ grabhls  -s http://localhost/live/test.m3u8 -o testing/{random}-file.mp4 -M bucket=testbucket
```

#### Compatibility issues with playback

Outputting to a stream requires the output to be seekable, a stream is not seekable so ffmpeg would normally throw an error.
To circumvent this we add additional flags that tell ffmpeg to generate a fragmented file. This can cause playback problems in players like Quicktime.

You can prevent playback errors by using the temporary file method by adding the -t/--temp-file option.

```
$ grabhls  -s http://localhost/live/test.m3u8 -o testing/{random}-file.mp4 -M bucket=testbucket -t
```

This will first write the video to a temporary file before piping the resulting video to a stream.

### Auto retry mechanism

Grabhls allows you to automatically retry retrieving the remote file by adding the -a/--auto-retry option

```
$ grabhls  -s http://localhost/live/test.m3u8 -o testing/{random}-file.mp4 -M bucket=testbucket -a
```

The following additonal options are availableOptions

-r, --retry-count <n>    Maximum amount of retries (defaults to 5)
-R, --retry-timeout <n>  Retry timeout (in seconds) (defaults to 30)

### Creating clips

You can create a clip using the -S/start-time and -d/--duration flags:

```
# Creates a 30 second clip starting at the 30 second mark
$ grabhls  -s http://localhost/live/test.m3u8 -o testing/{random}-file.mp4 -M bucket=testbucket -S 30 -d 30
```

### Webhook Options

You can send data to another server if the output succeeds or fails.
This is controlled by the flag `--webhook-options` or `-w`.

Available flags:

| Option    | Effect                              |
|-----------|-------------------------------------|
| success   | Endpoint in success cases           |
| fail      | Endpoint in failure cases           |
| method    | Http method to be used in requests  |

Also, you may send additional flags to be sent along in the payload.

```
# Sends to GCS and triggers a POST on localhost /success with payload and random_data=123
$ grabhls -s /path/to/my/playlist.m3u8 -o some_output.mp4 -m gcs -M bucket=my-secret-bucket -w success=http://localhost:8000/success -w method=POST -w random_data=123
```

## Contributing
Todo
