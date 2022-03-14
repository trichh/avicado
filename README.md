# DataCenter Import Client

This client is being developed to handle the "T" and "L" steps of an Extract, Transform, Load process with the purpose of moving data into [Redacted] through [Redacted]'s REST API.

### Data

The data extract is still ongoing, but we have a large enough sample from two datasets (`DataCenters` and `Buildings`) to move forward.

The data is only partly validated, and imports will likely fail for some records. Additional transforms will be required before 100% of records will be loadable.

Existing data is bundled with this client at `src/data/`.

### Transforms

Transforms are currently being performed in-memory. No need to write the results to disk before processing. 

See the `enableImport()` method of the `DataClient` class for an example.

### API

The [Redacted] API has been a major problem. No official documentation exists, but we've tried to cobble some together on our own.

[[Redacted] API Documentation](https://app.swaggerhub.com/apis-docs/avicado-development/redacted/1.0.0)

The API does seem to follow RESTful patterns, and has some consistency when reporting validation errors.

- Intermittent server errors occur.
- Unexpected delays in responses occur.
- Requests to the API are rate limited, what we know is in the API documentation.
- A `DELETE` action should exist for the `Datacenters` resource. If they actually followed patterns, this should be easy to identify.
- There are validation problems with a good portion of the exported data. Mostly related to `buildings`, date formats, and bad data for `externalId` 

> The API doesn't really save anything, so don't be shy about running your process repeatedly. Rate limiting is very real though.

## The Challenge

The overall goal is to submit as many `DataCenter` objects for create and/or update as possible, and get successful results. A successful request will have an HTTP response code of `201` for created entities or `200` for updated entities.

Some `DataCenter` records will succeed right out of the box, others will need to be modified to be successful. Check out the schema documentation for more information on required fields, formatting, etc.

Another way to get more successes will be to handle temporary server errors (`500` and `503` status codes). This will probably involve modifying how requests are made.

A huge win would be accounting for the rate limiting evidenced by status codes of `429`.

You can also confirm the presence of the `DELETE` endpoint and add support for it to the `ApiClient`. This won't add to your success count, but WILL allow us to clean up errors, making us able to iterate faster.

There is no threshold for a 'winning' number of successes. It exists to provide a metric for progress and a goal. All progress is good progress.

### The Details

_How long should this take?_
- We ask that you spend about an hour on this exercise. If this sort of problem solving is appealing to you, and you want
    to spend more time on it, that's up to you. Really. We respect and appreciate your time.

_What should the resulting product be?_
- Ideally, your code, submitted with enough time to let us review it. During the actual technical interview, we'd like to see it run, and talk about what you did.

_Am I working on an actual product? How will you use the code I produce?_
- No, this project is a complete fabrication. It only exists for the purposes of evaluation and conversation. Likewise, the code you produce will only be used for assessment purposes. It will not be used in any product or project, private or public. If you have ideas you would like to share about how we can improve this exercise, we will gladly accept them, but we have no interest in stealing your hard work.

_What resources am I allowed to use?_
- This is unashamedly open-book. Google is your friend. Christopher Green from the interview process is happy to help as well. 
If you find the need for a new `npm` package, add it. If you think heavy refactoring is in order, go for it! What we ask for is honesty and transparency in your decision-making process. 
If you borrowed a block of code from another source, or added a new dependency, be prepared to tell us why you did so. 
If you attempted to fix a certain bug, but didn't complete it or get as far as you'd like, let's talk about what you did to get there.

### Setting up your environment

> You will need an active internet connection for this exercise!

This project uses the `lts/erbium` version of [nodejs](https://nodejs.org/en/download/). Looking at my console, I'm at `v12.22.1`. Anything over `v12` should be fine. 

Fork and clone the repository:
```
git clone <repository> .
```

Change to the created directory, and install dependencies with:
```
npm install
```

Once dependencies are installed, check the status of the API:
```
npm run status
```
If you get an error, check your environment first, but reach out to Christopher with any problems.

Finally, try your first import with:
```
npm run import
```

You're now good to go!

#### Tips
- If you want to iterate a little faster, reduce the sample size of records you're sending in each batch.
- There are options scattered around for logging. If there's too much or too little, you should be able to tweak some.
- Many objects are preserved through the runtime of the application, so you can log even more!
- `npm run debug` and use Chrome's debugger to step through execution
- Pay attention to error messages and validation messages. They will help point you in the right direction.
- If you have questions, reach out.
