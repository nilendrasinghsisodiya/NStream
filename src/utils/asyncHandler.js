

const asyncHandler = (requestHandler)=>{

   return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next))
        .catch((err)=>{next(err)})
    }

}


export {asyncHandler}
// can be done this way too but it is redundant
// return (req,res,next)=>{
// return new Promise((reject,resolve)=>{
//   resolve(req,res,next)
  
// }
// ).catch((err)=>next(err))
// }


// callback => {  async another callback}



// try catch approach

// const asyncHandler = (func)=> async(req,res ,next)=> {
//     try{

//         await func(req,res,next)

//     }catch(error){
//         res.status(error.code || 500).json({
//             success: false,
//          message: error.message
//         })
//     }
// }