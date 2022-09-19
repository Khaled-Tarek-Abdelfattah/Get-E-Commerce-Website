const btn = document.querySelectorAll('.adding-to-cart');
$(document).ready(function(){
  for(var i = 0;i<btn.length;i++){
    $('.adding-to-cart').attr('id', function(i) {
     return 'item'+(i);
  });
  }
  for(var i = 0;i<btn.length;i++){
    $("#item"+i).click(function(){
      $(this).text("Added to cart");
      $(this).css({"background-color":"black"});
      $(this).addClass("disabled");
    })
  }
})
