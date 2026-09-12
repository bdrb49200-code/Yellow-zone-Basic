document.getElementById("quoteForm").addEventListener("submit",function(e){
  e.preventDefault();
  document.getElementById("message").textContent="تم استلام طلبك بنجاح.";
  this.reset();
});
