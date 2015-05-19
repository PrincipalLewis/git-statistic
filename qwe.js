var yaa = require('node-yaa');


function print(complete, cancel, input) {
  console.log(input);
  complete();
}


yaa.proc.sequence(
    print,
    yaa.iterator.array()
).call(this, function() {}, function() {}, [1, 2, 3, 4]);

