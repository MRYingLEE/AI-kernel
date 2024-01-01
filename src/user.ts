// TodO:
// Voice Prefer: UK/US
// English Style: Academic (default)
// UI: Profile_picture, voice

// import ejs from 'ejs';

export enum CefrLevel {
  A1 = 'Breakthrough or Beginner',
  A2 = 'Waystage or Elementary',
  B1 = 'Threshold or Intermediate',
  B2 = 'Vantage or Upper Intermediate',
  C1 = 'Effective Operational Proficiency or Advanced',
  C2 = 'Mastery or Proficiency'
}

export class user {
  name: string; // the name of the this
  othernames: string[] = []; // the other names of the this //Todo: Names in all kinds of language
  age: number; // the age of the this
  gender: string; // the gender of the this
  city: string;
  motherLanguage: string; // the this's native language
  englishLevel: CefrLevel; // the this's English proficiency level, based on the CEFR
  school: string; // the school the this attends
  other: string;
  // constructor method to initialize the attributes of the this class
  constructor(
    name: string,
    age: number,
    gender: string,
    city: string,
    motherLanguage: string,
    englishLevel: string,
    school: string,
    other: string
  ) {
    this.age = age;
    this.gender = gender;
    this.city = city;
    this.motherLanguage = motherLanguage;
    this.englishLevel = user.fromString(englishLevel);
    this.name = name;
    this.school = school;
    this.other = other;
  }

  self_introduction(): string {
    return (
      'My name is ' +
      this.name +
      '. I am ' +
      this.age +
      ' years old and I live in ' +
      this.city +
      '. My mother tongue is ' +
      this.motherLanguage +
      ' and my English proficiency level is ' +
      this.englishLevel +
      '. I attend ' +
      this.school +
      '. ' +
      this.other +
      '.' +
      'Please adapt your response to my situation.'
    );
  }

  static fromString(level: string): CefrLevel {
    switch (level) {
      case 'A1':
        return CefrLevel.A1;
      case 'A2':
        return CefrLevel.A2;
      case 'B1':
        return CefrLevel.B1;
      case 'B2':
        return CefrLevel.B2;
      case 'C1':
        return CefrLevel.C1;
      case 'C2':
        return CefrLevel.C2;
      default:
        throw new Error(`Invalid CEFR level: ${level}`);
    }
  }

  static current_user = new user(
    'Max LI',
    10,
    'male',
    'Hong Kong',
    'Chinese',
    'A2',
    'Po On Commercial Association Wan Ho Kan Primary School',
    'I like origami and comics'
  );

  static self_introduction(): string {
    return user.current_user.self_introduction();
  }

  static fromJson(jsonString: string): boolean {
    const obj = JSON.parse(jsonString);
    // Create a new instance of the user class using the properties from the parsed JSON object
    try {
      const newUser = new user(
        obj.name,
        obj.age,
        obj.gender,
        obj.city,
        obj.motherLanguage,
        obj.englishLevel,
        obj.school,
        obj.other
      );
      user.current_user = newUser;
      return true;
    } catch (error: any) {
      return false;
    }
  }
}
