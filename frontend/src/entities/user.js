class User{

  constructor(name = '', role = '', id = ''){
    this.name = name;
    this.role = role;
    this.id = id;
  }

  static fromJSON(data = {}){
    const user = new User(data.name, data.role, data.id);
    return user;
  }
}
export default User;