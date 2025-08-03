// this a one time use function create for bulk updates in documents in mongoDb existing documents use with caution.


export const updateManyFieldsInDoc = (modal,filter, query) => {
  modal
    .updateMany(filter,query)
    .then(() => {
      console.log("bulk model updation successfull");
    })
    .catch((err) => console.log(err.message));
};


