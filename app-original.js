const fs = require('fs');
const express = require('express');
const morgan = require('morgan');

const app = express();
const port = 3000;

//Middleware
app.use(morgan('dev'));

app.use(express.json());

app.use((req, res, next) => {
  console.log('Hello from the middleware 👋');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Routing
// app.get('/', (req, res) => {
//   res.status(200).json({
//     message: 'Hello from the server side😄',
//     app: 'Notours',
//   });
// });
// app.get('/dick', (req, res) => {
//   res.send('You are a dick');
// });

// app.post('/', (req, res) => {
//   res.send('You can post to this endpoint');
// });

//Reading the data from file and convert it into js object
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);
//Sending the json data to the browser
app.get('/api/v1/tours', (req, res) => {
  console.log(req.requestTime);
  res.status(200).json({
    // send the data to the browser in jsend format
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length, // to send user the number of results
    data: {
      tours: tours,
    },
  });
});

/** URL parssing
 * for find property used below
 So it'll basically loop through the array,and in each of the iterations,we will have access to the current element,and we will return either true or false
in each of the iterations, okay?Now what the find method will then do is that basically, it will create an array which only contains the element where this comparison here turns out to be true.
And in this situation, we want to find the element where the ID is equal to the one that we get from the parameters.And so by specifying this callback function here
with this comparison, we will ensur that only the element where the ID is actually equal to the specified ID in the parameterswill get returned from the find method
and stored into tour
 */
app.get('/api/v1/tours/:id', (req, res) => {
  console.log(req.params);
  const id = req.params.id * 1;

  // if (id > tours.length) {
  //   return res.status(404).json({
  //     status: 'Fail',
  //     message: 'Invalid ID',
  //   });
  // }
  const tour = tours.find((element) => element.id === id);
  if (!tour) {
    return res.status(404).json({
      status: 'Fail',
      message: 'Invalid ID',
    });
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

// making post request to add new tours in the tours object
app.post('/api/v1/tours', (req, res) => {
  // console.log(req.body); // body property is aviable because of middleware

  // saving the request data into the json file
  //1 Alloting id to the  new request data
  const newId = tours[tours.length - 1].id + 1;
  //2 Creating new tour
  const newTour = Object.assign({ id: newId }, req.body);
  //console.log(req.body);
  //console.log(newTour);
  //3 Push the new tour to the tours array
  tours.push(newTour);
  //4 writing it to the json file
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  );
});

//Update tour using patch
app.patch('/api/v1/tours/:id', (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'Fail',
      message: 'Invalid ID',
    });
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here>',
    },
  });
});

//Delete a tour from tours array
app.delete('/api/v1/tours/:id', (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'Fail',
      message: 'Invalid ID',
    });
  }
  res.status(204).json({
    status: 'success',
    data: {
      tour: 'null',
    },
  });
});

const getAllUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};
const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};
const getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};
const updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};
const deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};
// Users resources

app.route('/api/v1/users').get(getAllUsers).post(createUser);

app
  .route('/api/v1/users/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

//Starting the server
app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
