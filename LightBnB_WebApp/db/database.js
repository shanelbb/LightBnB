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

const getAllProperties = (options, limit = 10) => {
  return pool
    .query(`SELECT * FROM properties LIMIT $1`, [limit])
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.error(err.message);
    });
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
