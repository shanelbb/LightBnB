const {Pool} = require("pg");

const pool = new Pool({
  user: "development",
  password: "development",
  host: "localhost",
  database: "lightbnb",
});

// pool.query(`SELECT title FROM properties LIMIT 10;`).then((response) => {
//   console.log(response);
// });

const properties = require("./json/properties.json");
const users = require("./json/users.json");

/// Users

const getUserWithEmail = function(email) {
  const query = `
    SELECT *
    FROM users
    WHERE LOWER(email) = LOWER($1);
  `;

  return pool
    .query(query, [email])
    .then((res) => {
      if (res.rows.length === 0) {
        return null; // User not found
      } else {
        return res.rows[0]; // Return the first user found
      }
    })
    .catch((err) => {
      console.error("Error executing query", err);
      throw err; // Rethrow the error
    });
};

const getUserWithId = function(id) {
  const query = `
    SELECT *
    FROM users
    WHERE id = $1;
  `;

  return pool
    .query(query, [id])
    .then((res) => {
      if (res.rows.length === 0) {
        return null; // User not found
      } else {
        return res.rows[0]; // Return the first user found
      }
    })
    .catch((err) => {
      console.error("Error executing query", err);
      throw err; // Rethrow the error
    });
};

const addUser = function(user) {
  const query = `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

  return pool
    .query(query, [user.name, user.email, user.password])
    .then((res) => {
      if (res.rows.length === 0) {
        throw new Error("Failed to add user"); // Throw error if user was not added
      } else {
        return res.rows[0]; // Return the newly added user
      }
    })
    .catch((err) => {
      console.error("Error executing query", err);
      throw err; // throw the error
    });
};

/// Reservations

const getAllReservations = function(guest_id, limit = 10) {
  const query = `
        SELECT 
            reservations.id, 
            properties.title, 
            properties.thumbnail_photo_url,
            properties.cost_per_night, 
            properties.number_of_bedrooms,
            properties.number_of_bathrooms,
            properties.parking_spaces,
            reservations.start_date, 
            AVG(property_reviews.rating) AS average_rating
        FROM reservations
        JOIN properties ON reservations.property_id = properties.id
        JOIN property_reviews ON properties.id = property_reviews.property_id
        WHERE reservations.guest_id = $1
        GROUP BY properties.id, reservations.id
        ORDER BY reservations.start_date
        LIMIT $2;`;

  return pool
    .query(query, [guest_id, limit])
    .then((res) => {
      if (res.rows.length === 0) {
        throw new Error("No reservations found for this user."); // Throw error if no reservations found
      } else {
        return res.rows; // Return reservations
      }
    })
    .catch((err) => {
      console.error("Error executing query", err);
      throw err; // throw the error
    });
};

/// Properties

const getAllProperties = function(options, limit = 10) {
  const queryParams = [];
  const min = options.minimum_price_per_night;
  const max = options.maximum_price_per_night;

  let queryString = `
        SELECT 
            properties.*, 
            AVG(property_reviews.rating) AS average_rating
        FROM properties
        INNER JOIN property_reviews ON properties.id = property_reviews.property_id
        WHERE 1=1`;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += ` AND city LIKE $${queryParams.length}`;
  }

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += ` AND owner_id = $${queryParams.length}`;
  }

  if (min && max) {
    queryParams.push(min * 100, max * 100); // multiply values by 100 to convert to cents
    queryString += ` AND (cost_per_night >= $${queryParams.length - 1} AND cost_per_night <= $${queryParams.length})`;
  } else if (min) {
    queryParams.push(min * 100);
    queryString += ` AND cost_per_night >= $${queryParams.length}`;
  } else if (max) {
    queryParams.push(max * 100);
    queryString += ` AND cost_per_night <= $${queryParams.length}`;
  }

  queryString += `
        GROUP BY properties.id`;

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += ` HAVING avg(property_reviews.rating) >= $${queryParams.length}`;
  }

  queryParams.push(limit);

  queryString += `
        ORDER BY cost_per_night
        LIMIT $${queryParams.length};`;


  return pool
    .query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      throw err;
    });
};


const addProperty = function (property) {
  const query = `
        INSERT INTO properties 
        (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night,
        street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
        RETURNING *`;

  const values = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night,
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms,
  ];

  return pool
    .query(query, values)
    .then((res) => {
      if (res.rows.length === 0) {
        throw new Error("Failed to add property.");
      } else {
        return res.rows[0];
      }
    })
    .catch((err) => {
      throw err;
    });
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
